"""
M1 distributor: polls jobs.status='pending' every 10 s and spawns one
worker.py process per pending job.

Before spawning, it CLAIMS the job with a conditional update
(pending → downloading, only if it is still pending). Only the poll that wins
the claim spawns a worker, so a slow-starting worker can't be spawned twice
(which would also mean paying Whisper twice for the same video).

Reads SUPABASE_URL + SUPABASE_SECRET_KEY from AWS Secrets Manager.
Same auth model as worker.py — IAM instance profile grants
`secretsmanager:GetSecretValue` on the supabase-* secret names.

Stuck-job protection (no manual DB edits needed):
  * worker.py marks its own crashes as 'failed' (with a reason).
  * On startup, any job still in 'downloading'/'transcribe' is an orphan (its
    worker died with the previous service/EC2 run) → 'failed', "interrupted".
  * Every few minutes, a job with no progress for STALE_AFTER → 'failed', "timed out".
  A job that already has its credit deduction is completed as 'done' instead,
  so nobody is charged for a failed job and no charged job shows as failed.
"""
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import boto3
from supabase import create_client


def _load_secrets() -> dict[str, str]:
    sm = boto3.client("secretsmanager")
    return {
        "SUPABASE_URL": sm.get_secret_value(SecretId="supabase-url")["SecretString"].strip(),
        "SUPABASE_SECRET_KEY": sm.get_secret_value(SecretId="supabase-secret-key")["SecretString"].strip(),
    }


_secrets = _load_secrets()
db = create_client(_secrets["SUPABASE_URL"], _secrets["SUPABASE_SECRET_KEY"])

WORKER = Path(__file__).parent / "worker.py"
PYTHON = sys.executable  # use the same venv we're running in


def claim(job_id: str) -> bool:
    """Atomically move a job from pending to downloading. True if we won."""
    res = (
        db.table("jobs")
        .update({"status": "downloading", "updated_at": _now()})
        .eq("id", job_id)
        .eq("status", "pending")
        .execute()
    )
    return bool(res.data)


IN_PROGRESS = ["downloading", "transcribe"]
STALE_AFTER = timedelta(hours=2)   # a 3-hour video transcribes in ~20–30 min
SWEEP_EVERY_S = 300

MSG_INTERRUPTED = ("Processing was interrupted (server restarted). You were not charged — "
                   "please submit it again. / 處理被中斷（伺服器重新啟動），沒有扣點，請重新送出。")
MSG_TIMED_OUT = ("Processing timed out. You were not charged — please submit it again. "
                 "/ 處理逾時，沒有扣點，請重新送出。")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def finish_stuck(job_id: str, message: str) -> None:
    """Terminal state for a job whose worker is gone. Only touches jobs still in progress."""
    charged = (
        db.table("credit_transactions").select("id").eq("job_id", job_id)
        .eq("type", "deduction").lt("amount", 0).limit(1).execute().data
    )
    fields = {"status": "done"} if charged else {"status": "failed", "error_message": message}
    db.table("jobs").update({**fields, "updated_at": _now()}).eq("id", job_id).in_(
        "status", IN_PROGRESS
    ).execute()
    print(f"stuck job {job_id} → {fields['status']}", flush=True)


def sweep(older_than: timedelta | None, message: str) -> None:
    q = db.table("jobs").select("id").in_("status", IN_PROGRESS)
    if older_than is not None:
        q = q.lt("updated_at", (datetime.now(timezone.utc) - older_than).isoformat())
    for row in q.execute().data:
        finish_stuck(row["id"], message)


def poll_once() -> None:
    rows = db.table("jobs").select("id").eq("status", "pending").order("created_at").execute().data
    for row in rows:
        if not claim(row["id"]):
            continue  # someone else (or an earlier poll) already took it
        env = {**os.environ, "JOB_ID": row["id"]}
        subprocess.Popen([PYTHON, str(WORKER)], env=env)
        print(f"spawned worker for job {row['id']}", flush=True)


def main() -> None:
    print("distributor: polling every 10s.", flush=True)
    # Nothing can be running yet, so every in-progress job is an orphan.
    try:
        sweep(None, MSG_INTERRUPTED)
    except Exception as e:
        print(f"startup sweep error: {e}", file=sys.stderr, flush=True)
    last_sweep = time.monotonic()
    while True:
        try:
            poll_once()
            if time.monotonic() - last_sweep >= SWEEP_EVERY_S:
                last_sweep = time.monotonic()
                sweep(STALE_AFTER, MSG_TIMED_OUT)
        except Exception as e:
            print(f"poll error: {e}", file=sys.stderr, flush=True)
        time.sleep(10)


if __name__ == "__main__":
    main()
