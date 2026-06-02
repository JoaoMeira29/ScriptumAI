"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { createInviteRequest } from "@/services/auth-api";

type CreateInviteDialogProps = {
  onInviteCreated?: () => void;
};

export function CreateInviteDialog({ onInviteCreated }: CreateInviteDialogProps) {
  const { user, getAccessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setEmail("");
    setRole("member");
    setError(null);
    setSuccess(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(resetForm, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.organization_id) {
      setError("Organization not found");
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await createInviteRequest(
        {
          email: email.trim(),
          role,
          organizationId: user.organization_id,
        },
        getAccessToken,
      );

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        onInviteCreated?.();
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium px-2.5 py-2 hover:bg-primary/90 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Mail className="size-4 mr-2" />
        New Invite
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Invite</DialogTitle>
          <DialogDescription>Send an invite to a new user to join the organization.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading || success}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading || success}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="USER">Member</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-700 dark:bg-green-950/40 dark:text-green-200">
                Invite sent successfully!
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading || success}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email.trim() || success}>
              {loading ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
