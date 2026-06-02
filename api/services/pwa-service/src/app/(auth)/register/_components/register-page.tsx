"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { SiteNav } from "@/components/site-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  monthlyPrice: string;
  description: string;
  freeTrial?: string;
  requiresPayment?: boolean;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    id: "free-trial",
    name: "Free Trial",
    monthlyPrice: "Free for 15 days",
    description: "Immediate app access with no upfront payment.",
    freeTrial: "15-day free trial",
    requiresPayment: false,
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: "€49/month",
    description: "Up to 10 users and essential document processing.",
    requiresPayment: true,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: "€99/month",
    description: "Up to 30 users with advanced automations.",
    requiresPayment: true,
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: "Custom pricing",
    description: "Unlimited scale and dedicated support.",
    requiresPayment: true,
  },
];

export function RegisterPage() {
  const { register, isLoading, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const requestedPlanId = searchParams.get("plan");
    const isValidPlan = plans.some((plan) => plan.id === requestedPlanId);
    return isValidPlan && requestedPlanId ? requestedPlanId : "free-trial";
  });

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationCity, setOrganizationCity] = useState("");
  const [organizationAddress, setOrganizationAddress] = useState("");
  const [organizationContact, setOrganizationContact] = useState("");
  const [organizationZipCode, setOrganizationZipCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [localError, setLocalError] = useState("");

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId), [selectedPlanId]);
  const isFreeTrialSelected = selectedPlan?.id === "free-trial";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    if (!selectedPlan) {
      setLocalError("Select a plan to continue.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }

    if (!acceptedTerms) {
      setLocalError("You must accept the terms to create your organization.");
      return;
    }

    if (!organizationName.trim()) {
      setLocalError("Organization name is required.");
      return;
    }

    if (!isFreeTrialSelected) {
      setLocalError("Paid plans are not available yet. Select Free Trial.");
      return;
    }

    try {
      const normalizedUsername = username.trim();
      await register({
        name,
        surname,
        username: normalizedUsername || undefined,
        organizationName: organizationName.trim() || undefined,
        organizationCity: organizationCity.trim() || undefined,
        organizationAddress: organizationAddress.trim() || undefined,
        organizationContact: organizationContact.trim() || undefined,
        organizationZipCode: organizationZipCode.trim() || undefined,
        email,
        password,
      });
      router.push("/dashboard");
    } catch {}
  }

  const displayError = localError || error;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-white text-foreground dark:from-[--background] dark:via-[--card] dark:to-[--background]">
      <div className="pointer-events-none absolute -top-28 -left-16 size-72 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-24 size-72 rounded-full bg-blue-300/25 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-6">
        <SiteNav className="mb-8" />

        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_1fr]">
          <section className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Create organization</p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Choose a plan first, then complete your registration.
              </h1>
              <p className="text-muted-foreground">
                The Free Trial plan gives immediate access for 15 days. Paid plans keep the standard subscription flow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {plans.map((plan) => {
                const isActive = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{plan.name}</h2>
                      {plan.featured ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                          Popular
                        </span>
                      ) : null}
                    </div>
                    <p className="text-base font-medium">{plan.monthlyPrice}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                    {plan.freeTrial ? <p className="mt-2 text-sm font-medium text-primary">{plan.freeTrial}</p> : null}
                    {!plan.requiresPayment ? (
                      <p className="mt-1 text-xs font-medium text-primary">
                        Create your account and start using the app.
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Selected plan: <strong>{selectedPlan?.name}</strong>
              {selectedPlan?.freeTrial ? (
                <>
                  {" "}
                  · <strong>{selectedPlan.freeTrial}</strong>
                </>
              ) : null}
            </div>
          </section>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Organization details</CardTitle>
              <CardDescription>Fill in your details to create the account.</CardDescription>
            </CardHeader>

            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="name">First name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John"
                      required
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
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="username">Username (optional)</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="joao.silva"
                    minLength={3}
                  />
                  <p className="text-xs text-muted-foreground">If left blank, it will be generated automatically.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="organizationName">Organization name</Label>
                  <Input
                    id="organizationName"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="DST"
                    required
                    minLength={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="organizationCity">City</Label>
                  <Input
                    id="organizationCity"
                    value={organizationCity}
                    onChange={(e) => setOrganizationCity(e.target.value)}
                    placeholder="Barcelos"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="organizationAddress">Address</Label>
                  <Input
                    id="organizationAddress"
                    value={organizationAddress}
                    onChange={(e) => setOrganizationAddress(e.target.value)}
                    placeholder="Campus do IPCA"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="organizationContact">Contact</Label>
                    <Input
                      id="organizationContact"
                      type="tel"
                      value={organizationContact}
                      onChange={(e) => setOrganizationContact(e.target.value.replace(/\D/g, ""))}
                      placeholder="912345678"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="organizationZipCode">ZIP code</Label>
                    <Input
                      id="organizationZipCode"
                      value={organizationZipCode}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
                        const formatted = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
                        setOrganizationZipCode(formatted);
                      }}
                      placeholder="4750-810"
                      maxLength={8}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must have uppercase, lowercase, number and special character.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    {isFreeTrialSelected
                      ? "I confirm that I accept the terms to start the 15-day Free Trial with immediate access."
                      : "I confirm that I accept the terms and that the organization will be activated after plan payment."}
                  </span>
                </label>

                {displayError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                    {displayError}
                  </p>
                ) : null}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading
                    ? "Creating account..."
                    : isFreeTrialSelected
                      ? "Create account and start trial"
                      : "Create account"}
                </Button>

                <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                  I already have an account
                </Link>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
