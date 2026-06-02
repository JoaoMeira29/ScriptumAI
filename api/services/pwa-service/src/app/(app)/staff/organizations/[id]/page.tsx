"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Mail, Users } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import {
  getOrganizationRequest,
  getMembershipsRequest,
  getOrgInvitesRequest,
  updateOrganizationRequest,
  updateUserRoleRequest,
  deleteMembershipRequest,
  deleteInviteRequest,
  type OrganizationDetail,
  type Membership,
  type InviteRecord,
} from "@/services/auth-api";

const BG =
  "min-h-screen bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background] text-foreground";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    pending:   "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    inactive:  "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.inactive}`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    staff: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    user:  "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role] ?? styles.user}`}>
      {role}
    </span>
  );
}

function OrgRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function StaffOrgDetailPage() {
  const { isAuthenticated, isLoading, user, getAccessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;

  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});
  const [roleSaving, setRoleSaving] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!orgId) return;
    setOrgLoading(true);
    setMembersLoading(true);
    setInvitesLoading(true);

    const [orgRes, membersRes, invitesRes] = await Promise.allSettled([
      getOrganizationRequest(orgId, getAccessToken() ?? ""),
      getMembershipsRequest(orgId, getAccessToken),
      getOrgInvitesRequest(orgId, getAccessToken),
    ]);

    if (orgRes.status === "fulfilled") setOrg(orgRes.value);
    else setError("Failed to load organization data.");
    setOrgLoading(false);

    if (membersRes.status === "fulfilled") setMemberships(Array.isArray(membersRes.value) ? membersRes.value : []);
    setMembersLoading(false);

    if (invitesRes.status === "fulfilled") setInvites(Array.isArray(invitesRes.value) ? invitesRes.value : []);
    setInvitesLoading(false);
  };

  const handleToggleStatus = async () => {
    if (!org) return;
    const newStatus = org.status === "suspended" ? "active" : "suspended";
    const label = newStatus === "suspended" ? "suspend" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${label} "${org.name}"?`)) return;

    setStatusLoading(true);
    try {
      const updated = await updateOrganizationRequest(org.id, { status: newStatus }, getAccessToken);
      setOrg((prev) => prev ? { ...prev, status: updated.status } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRoleChange = async (membership: Membership) => {
    const newRole = roleEdits[membership.id] ?? membership.role;
    if (!window.confirm(`Change role to "${newRole}"?`)) return;
    setRoleSaving(membership.id);
    try {
      const userId = membership.userId ?? (membership as unknown as { user_id: string }).user_id;
      await updateUserRoleRequest(userId, newRole, getAccessToken);
      setMemberships((prev) => prev.map((m) => m.id === membership.id ? { ...m, role: newRole } : m));
      setRoleEdits((prev) => { const n = { ...prev }; delete n[membership.id]; return n; });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role.");
    } finally {
      setRoleSaving(null);
    }
  };

  const handleRemoveMember = async (membership: Membership) => {
    const name = membership.user ? `${membership.user.name} ${membership.user.surname}` : membership.userId;
    if (!window.confirm(`Remove "${name}" from the organization?`)) return;
    setRemoveLoading(membership.id);
    try {
      await deleteMembershipRequest(membership.id, getAccessToken);
      setMemberships((prev) => prev.filter((m) => m.id !== membership.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member.");
    } finally {
      setRemoveLoading(null);
    }
  };

  const handleCancelInvite = async (invite: InviteRecord) => {
    if (!window.confirm(`Cancel invite for ${invite.email}?`)) return;
    setCancelLoading(invite.id);
    try {
      await deleteInviteRequest(invite.id, getAccessToken);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invite.");
    } finally {
      setCancelLoading(null);
    }
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "staff")) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.role === "staff" && orgId) fetchAll();
  }, [user?.role, orgId]);

  if (isLoading || !isAuthenticated || user?.role !== "staff") {
    return (
      <main className={BG}>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-64 rounded-lg bg-muted" />
        </div>
      </main>
    );
  }

  return (
    <main className={BG}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        <SiteNav className="mb-2" />

        {/* Back + Header */}
        <div className="space-y-2">
          <button
            onClick={() => router.push("/staff/organizations")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            All organizations
          </button>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {orgLoading ? <Skeleton className="h-7 w-48 inline-block" /> : (org?.name ?? "Organization")}
              </h1>
              <p className="text-sm text-muted-foreground">Staff · organization details</p>
            </div>
            {org && (
              <button
                disabled={statusLoading}
                onClick={handleToggleStatus}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  org.status === "suspended"
                    ? "border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                    : "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                }`}
              >
                {statusLoading ? "Processing..." : org.status === "suspended" ? "Reactivate" : "Suspend"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Org Info */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-muted-foreground" />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {orgLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : org ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <OrgRow label="Name">{org.name || "—"}</OrgRow>
                <OrgRow label="Email">{org.email || "—"}</OrgRow>
                <OrgRow label="City">{org.city || "—"}</OrgRow>
                <OrgRow label="Address">{org.address || "—"}</OrgRow>
                <OrgRow label="Contact">{org.contact ?? "—"}</OrgRow>
                <OrgRow label="Zip Code">{org.zipCode || "—"}</OrgRow>
                <OrgRow label="Status"><StatusBadge status={org.status} /></OrgRow>
                <OrgRow label="Created at">{formatDate(org.createdAt)}</OrgRow>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Data not available.</p>
            )}
          </CardContent>
        </Card>

        {/* Members */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-muted-foreground" />
              Members
              {!membersLoading && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">{memberships.length} members</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {membersLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : memberships.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <Users className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No members</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Since</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberships.map((m) => {
                      const displayName = m.user ? `${m.user.name} ${m.user.surname}` : m.userId;
                      const displayEmail = m.user?.email ?? "—";
                      const currentRole = roleEdits[m.id] ?? m.role;
                      const isDirty = currentRole !== m.role;
                      return (
                        <tr key={m.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{displayName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{displayEmail}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <RoleBadge role={m.role} />
                              {m.role !== "staff" && (
                                <select
                                  value={currentRole}
                                  onChange={(e) => setRoleEdits((prev) => ({ ...prev, [m.id]: e.target.value }))}
                                  disabled={roleSaving === m.id}
                                  className="rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
                                >
                                  <option value="admin">admin</option>
                                  <option value="user">user</option>
                                </select>
                              )}
                              {isDirty && m.role !== "staff" && (
                                <button
                                  disabled={roleSaving === m.id}
                                  onClick={() => handleRoleChange(m)}
                                  className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                >
                                  {roleSaving === m.id ? "…" : "Save"}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(m.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              disabled={removeLoading === m.id}
                              onClick={() => handleRemoveMember(m)}
                              className="rounded-md border border-red-300 bg-background px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                            >
                              {removeLoading === m.id ? "Removing…" : "Remove"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invites */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-muted-foreground" />
              Pending Invites
              {!invitesLoading && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">{invites.filter((i) => !isExpired(i.expiresAt)).length} pending</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {invitesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : invites.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <Mail className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No invites</p>
              </div>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => {
                  const expired = isExpired(invite.expiresAt);
                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{invite.email || "—"}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            expired
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          }`}>
                            {expired ? "Expired" : "Pending"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {invite.role && <span>Role: {invite.role}</span>}
                          {invite.expiresAt && <span className="ml-3">Expires: {formatDate(invite.expiresAt)}</span>}
                        </p>
                      </div>
                      <button
                        disabled={cancelLoading === invite.id}
                        onClick={() => handleCancelInvite(invite)}
                        className="shrink-0 rounded-md border border-red-300 bg-background px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                      >
                        {cancelLoading === invite.id ? "Cancelling…" : "Cancel"}
                      </button>
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
