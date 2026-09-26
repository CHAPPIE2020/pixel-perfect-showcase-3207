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

Known limitation (acceptable for M1): if worker.py crashes, the job stays
in whatever status it reached. Reset it with
  update jobs set status = 'pending' where id = '<job-id>';
and the next poll picks it up again.
"""
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
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
        .update({"status": "downloading", "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", job_id)
        .eq("status", "pending")
        .execute()
    )
    return bool(res.data)


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
    while True:
        try:
            poll_once()
        except Exception as e:
            print(f"poll error: {e}", file=sys.stderr, flush=True)
        time.sleep(10)


if __name__ == "__main__":
    main()
