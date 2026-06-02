"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
};

export function LoginForm({ onSubmit, loading }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(email, password);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="mt-1 w-full">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
