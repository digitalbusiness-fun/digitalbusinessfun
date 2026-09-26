import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { z } from "zod";
import { verifyPayment } from "@/lib/applications.functions";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/payment/callback")({
  validateSearch: z.object({ reference: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Payment status — DigitalBusiness.fun" },
      { name: "description", content: "Confirming your DigitalBusiness.fun website payment." },
      { property: "og:title", content: "Payment status — DigitalBusiness.fun" },
      { property: "og:description", content: "Confirming your DigitalBusiness.fun website payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentCallback,
});

function PaymentCallback() {
  const { reference } = Route.useSearch();
  const verify = useServerFn(verifyPayment);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["verify", reference],
    queryFn: () => verify({ data: { reference: reference ?? "" } }),
    enabled: !!reference,
    retry: 1,
  });
  const status = !reference || isError ? "failed" : isLoading ? "loading" : data?.status;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      <div className="max-w-md rounded-lg border border-border bg-card p-10 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto animate-spin text-primary" size={40} />
            <h1 className="mt-6 text-3xl font-extrabold">Verifying payment…</h1>
            <p className="mt-3 text-muted-foreground">This only takes a moment.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><Check /></div>
            <h1 className="mt-6 text-3xl font-extrabold">Payment confirmed.</h1>
            <p className="mt-3 leading-7 text-muted-foreground">Welcome to 100 Businesses Online. Next, tell us about your business so we can build a website that fits. It takes about 10 minutes and saves as you go.</p>
            {data && "onboardingToken" in data && data.onboardingToken && (
              <>
                <Button asChild className="mt-8"><Link to="/onboarding/$token" params={{ token: data.onboardingToken }}>Start onboarding</Link></Button>
                <p className="mt-3 text-xs text-muted-foreground">Bookmark that page — it's your personal link to come back and finish later.</p>
              </>
            )}
          </>
        )}
        {(status === "failed" || status === "pending") && (
          <>
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-destructive"><X /></div>
            <h1 className="mt-6 text-3xl font-extrabold">{status === "pending" ? "Payment not completed" : "We couldn't confirm your payment"}</h1>
            <p className="mt-3 leading-7 text-muted-foreground">No worries—if you were charged, we'll confirm it automatically. Otherwise, you can apply again.</p>
          </>
        )}
        <Button asChild className="mt-8" variant="outline"><Link to="/">Back to home</Link></Button>
      </div>
    </main>
  );
}
