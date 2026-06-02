"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SiteNav } from "@/components/site-nav";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatEndedAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function TrialExpiredPage() {
  const searchParams = useSearchParams();
  const endedAtText = formatEndedAt(searchParams.get("endedAt"));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <SiteNav className="mb-8" />

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Trial expired</CardTitle>
            <CardDescription>
              Your trial period has ended and access has been blocked.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {endedAtText ? (
              <p className="text-sm text-muted-foreground">
                Expiration date: <strong>{endedAtText}</strong>
              </p>
            ) : null}

            <p className="text-sm text-muted-foreground">
              You will soon be able to choose a paid plan to continue using the platform.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/login" className={buttonVariants()}>
                Back to login
              </Link>
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                View home page
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
