"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
import { resetPasswordRequest } from "@/services/auth-api";

type ResetPasswordPageProps = {
  token: string;
};

function getPasswordPolicyError(password: string): string | null {
  if (password.length < 8)
    return "Password must contain at least 8 characters.";
  if (!/[A-Z]/.test(password))
    return "Password must include at least 1 uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must include at least 1 lowercase letter.";
  if (!/[0-9]/.test(password))
    return "Password must include at least 1 number.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must include at least 1 special character.";
  return null;
}

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const missingToken = useMemo(() => !token.trim(), [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (missingToken) {
      showToast("The reset link is invalid or missing the token.", "error");
      return;
    }

    const policyError = getPasswordPolicyError(newPassword);
    if (policyError) {
      showToast(policyError, "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordRequest({ token, newPassword });
      showToast("Password reset successful. You can now sign in.", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to reset password.";
      showToast(message, "error");
    } finally {
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
                Reset password
              </CardTitle>
              <CardDescription>
                Create a new password to recover access to your account.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="NovaPassword123!"
                    required
                    minLength={8}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Password must contain at least 8 chars, 1 uppercase, 1
                  lowercase, 1 number and 1 special character.
                </p>

                <Button
                  type="submit"
                  disabled={isLoading || missingToken}
                  className="w-full"
                >
                  {isLoading ? "Resetting..." : "Reset password"}
                </Button>
              </form>

              <div className="grid gap-2">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full",
                  )}
                >
                  Back to sign in
                </Link>
                <Link
                  href="/forgot-password"
                  className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
                >
                  Request new reset link
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
