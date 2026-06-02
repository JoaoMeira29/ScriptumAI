"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoginForm } from "./login-form";
import { SiteNav } from "@/components/site-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { ApiRequestError } from "@/services/auth-api";

export function LoginPage() {
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleLogin(email: string, password: string) {
    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === "TRIAL_EXPIRED") {
        const endedAt = err.trialEndedAt
          ? `?endedAt=${encodeURIComponent(err.trialEndedAt)}`
          : "";
        router.push(`/trial-expired${endedAt}`);
      }
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background]">
      <div className="pointer-events-none absolute -top-28 -left-16 size-72 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-24 size-72 rounded-full bg-blue-300/25 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <SiteNav className="mb-8" />

        <div className="flex flex-1 items-center justify-center py-8">
          <Card className="relative w-full max-w-md shadow-2xl backdrop-blur">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto rounded-2xl border border-border bg-background p-3 shadow-sm">
                <Image
                  src="/logo-light.png"
                  alt="ScriptumAI logo"
                  width={170}
                  height={56}
                  priority
                  className="h-auto w-auto dark:hidden"
                />
                <Image
                  src="/logo-dark.png"
                  alt="ScriptumAI logo"
                  width={170}
                  height={56}
                  priority
                  className="hidden h-auto w-auto dark:block"
                />
              </div>

              <div className="space-y-1">
                <CardTitle className="text-2xl tracking-tight">
                  Sign in
                </CardTitle>
                <CardDescription>
                  Intelligent Document Processing System
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <LoginForm onSubmit={handleLogin} loading={isLoading} />

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
