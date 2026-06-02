"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import {
  getMembershipsRequest,
  updateMembershipRequest,
  deleteMembershipRequest,
  getOrgMembersRequest,
  type Membership,
  type OrgMember,
} from "@/services/auth-api";

const BG =
  "min-h-screen bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background] text-foreground";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />;
}

function RoleBadge({ role }: { role: string }) {
  const lower = role.toLowerCase();
  const styles: Record<string, string> = {
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    user:  "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[lower] ?? styles.user}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      status === "active"
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        : "bg-muted text-muted-foreground"
    }`}>
      {status}
    </span>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export default function AdminMembersPage() {
  const { isAuthenticated, isLoading, user, getAccessToken } = useAuth();
  const router = useRouter();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});
  const [roleSaving, setRoleSaving] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!user?.organization_id) return;
    setMembersLoading(true);
    try {
      const [list, users] = await Promise.all([
        getMembershipsRequest(user.organization_id, getAccessToken),
        getOrgMembersRequest(getAccessToken),
      ]);
      const userMap = new Map<string, OrgMember>();
      for (const u of Array.isArray(users) ? users : []) userMap.set(u.id, u);

      const enriched = (Array.isArray(list) ? list : [])
        .map((m) => {
          const u = userMap.get(m.userId);
          if (u) {
            return { ...m, user: { id: u.id, name: u.name, surname: u.surname, email: u.email, username: u.username }, status: u.status };
          }
          return m;
        })
        .filter((m) => m.user);
      setMemberships(enriched);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setMembersLoading(false);
    }
  };

  const handleRoleChange = async (membership: Membership) => {
    const newRole = roleEdits[membership.id] ?? membership.role;
    if (!window.confirm(`Change role of "${membership.user?.name ?? membership.userId}" to "${newRole}"?`)) return;
    setRoleSaving(membership.id);
    try {
      const updated = await updateMembershipRequest(membership.id, { role: newRole }, getAccessToken);
      setMemberships((prev) => prev.map((m) => m.id === membership.id ? { ...m, role: updated.role } : m));
      setRoleEdits((prev) => { const n = { ...prev }; delete n[membership.id]; return n; });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role.");
    } finally {
      setRoleSaving(null);
    }
  };

  const handleRemove = async (membership: Membership) => {
    const name = membership.user ? `${membership.user.name} ${membership.user.surname}` : membership.userId;
    if (!window.confirm(`Remove "${name}" from the organization? This action cannot be undone.`)) return;
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

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.role === "admin" && user.organization_id) fetchMembers();
  }, [user?.role, user?.organization_id]);

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

  const adminCount = memberships.filter((m) => m.role.toUpperCase() === "ADMIN").length;
  const userCount  = memberships.filter((m) => m.role.toUpperCase() === "USER").length;

  return (
    <main className={BG}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        <SiteNav className="mb-2" />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">Manage your organization's members</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total",   value: memberships.length, color: "border-t-primary" },
            { label: "Admins",  value: adminCount,          color: "border-t-[var(--chart-2)]" },
            { label: "Members", value: userCount,            color: "border-t-[var(--chart-3)]" },
          ].map((k) => (
            <Card key={k.label} className={`border-t-2 ${k.color} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
              </CardHeader>
              <CardContent className="pt-0">
                {membersLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-3xl font-bold">{k.value}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Table */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-muted-foreground" />
              Member List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {membersLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : memberships.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Users className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No members in the organization</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member since</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberships.map((m) => {
                      const displayName  = m.user ? `${m.user.name} ${m.user.surname}` : m.userId;
                      const displayEmail = m.user?.email ?? "—";
                      const currentRole  = roleEdits[m.id] ?? m.role;
                      const isDirty      = currentRole !== m.role;
                      const isSelf       = m.userId === user.id;

                      return (
                        <tr key={m.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            {displayName}
                            {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{displayEmail}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <RoleBadge role={m.role} />
                              {!isSelf && (
                                <select
                                  value={currentRole}
                                  onChange={(e) => setRoleEdits((prev) => ({ ...prev, [m.id]: e.target.value }))}
                                  disabled={roleSaving === m.id}
                                  className="rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
                                >
                                  <option value="ADMIN">admin</option>
                                  <option value="USER">user</option>
                                </select>
                              )}
                              {isDirty && !isSelf && (
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
                          <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(m.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            {!isSelf && (
                              <button
                                disabled={removeLoading === m.id}
                                onClick={() => handleRemove(m)}
                                className="rounded-md border border-red-300 bg-background px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                              >
                                {removeLoading === m.id ? "Removing…" : "Remove"}
                              </button>
                            )}
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
      </div>
    </main>
  );
}
