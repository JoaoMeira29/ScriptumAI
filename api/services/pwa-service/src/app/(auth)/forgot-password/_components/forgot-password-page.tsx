"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteNav } from "@/components/site-nav";
import { useToast } from "@/context/toast-context";
import { cn } from "@/lib/utils";
import { forgotPasswordRequest } from "@/services/auth-api";

const SUCCESS_MESSAGE =
  "If the account exists, you will receive password reset instructions by email.";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      await forgotPasswordRequest({ email: email.trim() });
    } catch {
      // Intentionally ignored to keep anti user-enumeration UX behavior.
    } finally {
      showToast(SUCCESS_MESSAGE, "success");
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background]">
      <div className="pointer-events-none absolute -top-28 -left-16 size-72 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-24 size-72 rounded-full bg-blue-300/25 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <SiteNav className="mb-8" />

        <div className="flex flex-1 items-center justify-center py-8">
          <Card className="w-full max-w-md shadow-2xl backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl tracking-tight">
                Forgot password
              </CardTitle>
              <CardDescription>
                Enter your account email and we will send reset instructions.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Sending..." : "Send reset email"}
                </Button>
              </form>

              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                Back to sign in
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
