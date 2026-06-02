"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Clock, CheckCircle, XCircle } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateInviteDialog } from "@/components/create-invite-dialog";
import { useAuth } from "@/context/auth-context";
import {
  getOrgInvitesRequest,
  deleteInviteRequest,
  resendInviteRequest,
  type InviteRecord,
} from "@/services/auth-api";

const BG =
  "min-h-screen bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background] text-foreground";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />;
}

function Badge({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "muted" | "success" | "error" }) {
  const classes: Record<string, string> = {
    primary: "bg-primary text-primary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full",
    muted:   "bg-muted text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium px-2.5 py-0.5 rounded-full",
    error:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium px-2.5 py-0.5 rounded-full",
  };
  return <span className={classes[variant]}>{children}</span>;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function AdminInvitesPage() {
  const { isAuthenticated, isLoading, user, getAccessToken } = useAuth();
  const router = useRouter();

  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, "revoke" | "resend" | null>>({});

  const setInviteAction = (id: string, action: "revoke" | "resend" | null) =>
    setActionLoading((prev) => ({ ...prev, [id]: action }));

  const fetchInvites = async () => {
    if (!user?.organization_id) return;
    setInvitesLoading(true);
    try {
      const list = await getOrgInvitesRequest(user.organization_id, getAccessToken);
      setInvites(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invites.");
      setInvites([]);
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleRevoke = async (invite: InviteRecord) => {
    if (!window.confirm(`Revoke invite for ${invite.email}?`)) return;
    setInviteAction(invite.id, "revoke");
    try {
      await deleteInviteRequest(invite.id, getAccessToken);
      await fetchInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invite.");
    } finally {
      setInviteAction(invite.id, null);
    }
  };

  const handleResend = async (invite: InviteRecord) => {
    setInviteAction(invite.id, "resend");
    try {
      await resendInviteRequest(invite, getAccessToken);
      await fetchInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invite.");
    } finally {
      setInviteAction(invite.id, null);
    }
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.role === "admin" && user.organization_id) fetchInvites();
  }, [user?.organization_id]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <main className={BG}>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-64 rounded-lg bg-muted" />
        </div>
      </main>
    );
  }

  const pendingInvites = invites.filter((inv) => !isExpired(inv.expiresAt));
  const expiredInvites = invites.filter((inv) => isExpired(inv.expiresAt));

  return (
    <main className={BG}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        <SiteNav className="mb-2" />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Invites</h1>
            <p className="text-sm text-muted-foreground">Manage user invites for the organization</p>
          </div>
          <CreateInviteDialog onInviteCreated={fetchInvites} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total",     value: invites.length,         icon: Mail,         color: "border-t-primary" },
            { label: "Pending",  value: pendingInvites.length,  icon: CheckCircle,  color: "border-t-[var(--chart-1)]" },
            { label: "Expired",  value: expiredInvites.length,  icon: XCircle,      color: "border-t-[var(--chart-5)]" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`border-t-2 ${color}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {invitesLoading ? <Skeleton className="h-7 w-12" /> : <span className="text-2xl font-bold">{value}</span>}
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Invites List */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Invite List</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {invitesLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            )}
            {!invitesLoading && invites.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Mail className="size-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No invites found</p>
              </div>
            )}
            {!invitesLoading && invites.length > 0 && (
              <div className="space-y-3">
                {invites.map((invite) => {
                  const expired = isExpired(invite.expiresAt);
                  return (
                    <div
                      key={invite.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <Mail className="size-5 shrink-0 text-muted-foreground mt-0.5" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{invite.email || "Email not available"}</span>
                            <Badge variant={expired ? "error" : "success"}>{expired ? "Expired" : "Pending"}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {invite.role && <span><strong>Role:</strong> {invite.role}</span>}
                            {invite.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                Expires: {formatDate(invite.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:shrink-0">
                        <button
                          onClick={() => handleResend(invite)}
                          disabled={!!actionLoading[invite.id]}
                          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[invite.id] === "resend" ? "Resending..." : "Resend"}
                        </button>
                        <button
                          onClick={() => handleRevoke(invite)}
                          disabled={!!actionLoading[invite.id]}
                          className="rounded-md border border-red-300 bg-background px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[invite.id] === "revoke" ? "Revoking..." : "Revoke"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
