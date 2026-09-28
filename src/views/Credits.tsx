import { format } from "date-fns";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CreditTiers, type CreditTier } from "@/components/CreditTiers";
import { cn } from "@/lib/utils";

export type CreditTransaction = {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  purchase: "Purchase / 購買",
  signup_bonus: "Signup bonus / 註冊贈點",
  deduction: "Usage / 扣點",
  admin_grant: "Grant / 補點",
};

const TYPE_STYLES: Record<string, string> = {
  purchase: "bg-status-done text-status-done-foreground",
  signup_bonus: "bg-status-bonus text-status-bonus-foreground",
  deduction: "bg-status-idle text-status-idle-foreground",
  admin_grant: "bg-status-active text-status-active-foreground",
};

function formatAmount(amount: number) {
  if (amount > 0) return `+${amount}`;
  if (amount < 0) return `−${Math.abs(amount)}`;
  return "0";
}

export function CreditsPage({
  balance,
  products,
  transactions,
  canceled,
}: {
  balance: number;
  products: CreditTier[];
  transactions: CreditTransaction[];
  canceled: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="hero-glow flex-1">
        <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-16">
          <h1 className="fade-up text-3xl font-semibold tracking-tight">Credits / 點數</h1>

          {canceled ? (
            <p className="fade-up rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Checkout was canceled — you weren't charged. / 已取消結帳，沒有扣款。
            </p>
          ) : null}

          {/* (a) Balance */}
          <section
            className="fade-up rounded-2xl border border-border bg-card p-6"
            style={{ animationDelay: "60ms" }}
          >
            <p className="text-sm text-muted-foreground">Your balance / 目前餘額</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
              {balance} <span className="text-lg font-medium text-muted-foreground">credits</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              1 credit = 1 minute of video (rounded up). / 1 點 = 1 分鐘影片（無條件進位）。
            </p>
          </section>

          {/* (b) Credit packs */}
          <section className="fade-up space-y-4" style={{ animationDelay: "120ms" }}>
            <h2 className="text-lg font-semibold tracking-tight">Buy credits / 購買點數</h2>
            {products.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
                No credit packs available right now.
              </p>
            ) : (
              <CreditTiers tiers={products} />
            )}
            <p className="text-xs text-muted-foreground">
              Payments run in Stripe sandbox mode — use test card 4242 4242 4242 4242. / 目前為
              Stripe 沙盒，請用測試卡 4242 4242 4242 4242。
            </p>
          </section>

          {/* (c) History */}
          <section
            className="fade-up overflow-hidden rounded-2xl border border-border bg-card"
            style={{ animationDelay: "180ms" }}
          >
            <h2 className="border-b border-border px-5 py-4 text-lg font-semibold tracking-tight">
              History / 交易紀錄
            </h2>
            {transactions.length === 0 ? (
              <p className="p-6 text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Description</th>
                      <th className="px-5 py-3 text-right font-medium">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-border last:border-b-0">
                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                          {format(new Date(t.createdAt), "yyyy-MM-dd HH:mm")}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              TYPE_STYLES[t.type] ?? TYPE_STYLES["deduction"],
                            )}
                          >
                            {TYPE_LABELS[t.type] ?? t.type}
                          </span>
                        </td>
                        <td className="min-w-[12rem] px-5 py-3">{t.description ?? "—"}</td>
                        <td
                          className={cn(
                            "whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums",
                            t.amount > 0 ? "text-status-done-foreground" : "text-muted-foreground",
                          )}
                        >
                          {formatAmount(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
