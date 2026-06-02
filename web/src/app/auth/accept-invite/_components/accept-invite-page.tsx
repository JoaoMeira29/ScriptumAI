"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteNav } from "@/components/site-nav";
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
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
  acceptInviteByIdRequest,
  checkEmailRequest,
  deleteInviteRequest,
  getInviteByTokenRequest,
  type InviteInfo,
} from "@/services/auth-api";

type AcceptInvitePageProps = {
  token: string;
};

type Mode = "register" | "login";

export function AcceptInvitePage({ token }: AcceptInvitePageProps) {
  const router = useRouter();
  const { login, register, user, isLoading: authLoading, getAccessToken } = useAuth();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch invite info on mount
  useEffect(() => {
    if (!token) {
      setInviteError("Invalid invite link.");
      setLoadingInvite(false);
      return;
    }

    getInviteByTokenRequest(token)
      .then(async (info) => {
        setInvite(info);
        setEmail(info.email);
        const exists = await checkEmailRequest(info.email).catch(() => false);
        setMode(exists ? "login" : "register");
      })
      .catch((err) => {
        setInviteError(
          err instanceof Error ? err.message : "Invalid or expired invite.",
        );
      })
      .finally(() => setLoadingInvite(false));
  }, [token]);

  // If already logged in with the correct account, accept the invite directly
  useEffect(() => {
    if (!authLoading && user && invite) {
      if (user.email === invite.email) {
        handleAcceptForLoggedInUser();
      }
    }
  }, [authLoading, user, invite]);

  async function handleAcceptForLoggedInUser() {
    if (!user || !invite) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await acceptInviteByIdRequest(invite.id, token, user.id, accessToken);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to accept invite.";
      // If already a member, just go to dashboard
      if (message.toLowerCase().includes("already a member")) {
        router.push("/dashboard");
      } else {
        setFormError(message);
        setIsSubmitting(false);
      }
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!invite) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      // Register the user joining the existing organization
      await register({
        name,
        surname,
        email,
        password,
        organizationId: invite.organizationId,
        role: invite.role,
      });

      // Delete the invite now that the user has joined via registration
      const accessToken = getAccessToken();
      if (accessToken) {
        await deleteInviteRequest(invite.id, () => accessToken).catch(() => {});
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!invite) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // After login, the useEffect above will handle acceptance
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to sign in.",
      );
      setIsSubmitting(false);
    }
  }

  const roleLabel = invite?.role === "ADMIN" ? "Administrator" : "Member";

  if (loadingInvite) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background]">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
          <SiteNav className="mb-8" />
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Loading invite...</p>
          </div>
        </div>
      </main>
    );
  }

  if (inviteError) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background]">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
          <SiteNav className="mb-8" />
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle>Invalid invite</CardTitle>
                <CardDescription>{inviteError}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                >
                  Go to login
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  // If already logged in with the correct account, show accepting state
  if (!authLoading && user && user.email === invite?.email) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background]">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
          <SiteNav className="mb-8" />
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle>Accepting invite...</CardTitle>
                <CardDescription>
                  Joining <strong>{invite?.organizationName}</strong>
                </CardDescription>
              </CardHeader>
              {formError && (
                <CardContent>
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                    {formError}
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
    );
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
                Invite to {invite?.organizationName}
              </CardTitle>
              <CardDescription>
                You were invited as <strong>{roleLabel}</strong> to{" "}
                <strong>{invite?.organizationName}</strong>.
                {mode === "register"
                  ? " Create an account to accept."
                  : " Sign in to accept."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {mode === "register" ? (
                <form className="grid gap-4" onSubmit={handleRegister}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="name">First name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="surname">Last name</Label>
                      <Input
                        id="surname"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="Doe"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                      disabled={isSubmitting}
                    />
                  </div>

                  {formError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                      {formError}
                    </p>
                  )}

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Creating account..." : "Create account and accept invite"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setMode("login"); setFormError(null); }}
                    className="text-sm text-center text-primary hover:underline w-full"
                  >
                    I already have an account — Sign in
                  </button>
                </form>
              ) : (
                <form className="grid gap-4" onSubmit={handleLogin}>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {formError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                      {formError}
                    </p>
                  )}

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Signing in..." : "Sign in and accept invite"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setMode("register"); setFormError(null); }}
                    className="text-sm text-center text-primary hover:underline w-full"
                  >
                    I don&apos;t have an account — Create one
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
