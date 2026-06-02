"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SiteNav } from "@/components/site-nav";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free-trial",
    name: "Free Trial",
    price: "Free for 15 days",
    users: "for new organizations",
    storage: "500 GB storage",
    featured: false,
    noPaymentSetup: true,
  },
  {
    id: "starter",
    name: "Starter",
    price: "€49/month",
    users: "up to 10 users",
    storage: "1 TB storage",
    featured: false,
    noPaymentSetup: false,
  },
  {
    id: "business",
    name: "Business",
    price: "€99/month",
    users: "up to 30 users",
    storage: "3 TB storage",
    featured: true,
    noPaymentSetup: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    users: "unlimited users",
    storage: "Unlimited storage",
    featured: false,
    noPaymentSetup: false,
  },
];

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background] text-foreground">
      <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/3 size-72 rounded-full bg-chart-2/20 blur-3xl" />

      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 pt-6 pb-16">
        <SiteNav className="mb-8" />

        <div className="mb-16 grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm text-primary">
              15-day free trial available on the Free Trial plan
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Automate documents, extract data, and generate summaries in
              seconds.
            </h1>
            <p className="text-lg text-muted-foreground">
              Our app centralizes intelligent document processing for teams that
              need speed, accuracy, and control.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Start now
              </Link>
              <Link
                href="#pricing"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                View pricing
              </Link>
            </div>
          </div>

          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>What you can do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>• Extract data from PDFs and batch documents</p>
              <p>• Generate automatic context-aware summaries</p>
              <p>• Classify documents by type and priority</p>
              <p>• Monitor results from a single dashboard</p>
            </CardContent>
          </Card>
        </div>

        <section id="pricing" className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold">Pricing</h2>
            <p className="text-muted-foreground">
              Choose Free Trial for 15-day demo access, or choose a paid plan.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={[
                  "relative h-full overflow-visible border-border bg-card pt-6 text-card-foreground",
                  plan.featured
                    ? "border-primary/60 ring-1 ring-primary/30"
                    : "",
                ].join(" ")}
              >
                {plan.featured ? (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                ) : null}

                <CardHeader>
                  <CardTitle className="text-3xl">{plan.name}</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col">
                  <div className="flex flex-1 flex-col space-y-5">
                    <div className="min-h-28">
                      <p className="text-4xl font-bold">{plan.price}</p>
                      <p className="min-h-12 text-muted-foreground">{plan.users}</p>
                    </div>

                    <div className="h-px bg-border" />

                    <ul className="min-h-44 space-y-2 text-muted-foreground">
                      <li>• {plan.storage}</li>
                      <li>• Data extraction</li>
                      <li>• Automatic summaries</li>
                      <li className="text-primary">
                        • {plan.noPaymentSetup ? "15-day trial included" : "No trial included"}
                      </li>
                      <li className="text-primary">
                        •{" "}
                        {plan.noPaymentSetup
                          ? "No payment required to start"
                          : "Payment required to activate"}
                      </li>
                    </ul>
                  </div>

                  <Link
                    href={`/register?plan=${plan.id}`}
                    className={cn(buttonVariants(), "mt-auto w-full")}
                  >
                    Learn more
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
