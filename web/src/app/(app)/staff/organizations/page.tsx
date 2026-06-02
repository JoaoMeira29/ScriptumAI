"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Building2, Search } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import {
  getAllOrganizationsRequest,
  updateOrganizationRequest,
  type OrganizationSummary,
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

// ─── Confirmation modal ───────────────────────────────────────────────────────

function ConfirmStatusModal({
  org,
  onConfirm,
  onCancel,
  loading,
}: {
  org: OrganizationSummary;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isSuspending = org.status !== "suspended";
  const action = isSuspending ? "Suspend" : "Reactivate";
  const description = isSuspending
    ? "Users of this organization will no longer be able to access the platform. You can reactivate at any time."
    : "Users of this organization will regain access to the platform.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        {/* Icon */}
        <div className={`mb-4 flex size-12 items-center justify-center rounded-full ${
          isSuspending ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"
        }`}>
          <AlertTriangle className={`size-6 ${isSuspending ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`} />
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-foreground">
          {action} organization
        </h2>

        {/* Org info */}
        <div className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <p className="font-medium text-foreground">{org.name}</p>
          {org.email && <p className="text-sm text-muted-foreground">{org.email}</p>}
          {org.city && <p className="text-sm text-muted-foreground">{org.city}</p>}
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isSuspending
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Processing..." : action}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffOrganizationsPage() {
  const { isAuthenticated, isLoading, user, getAccessToken } = useAuth();
  const router = useRouter();

  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmOrg, setConfirmOrg] = useState<OrganizationSummary | null>(null);

  const fetchOrgs = async () => {
    setOrgsLoading(true);
    try {
      const list = await getAllOrganizationsRequest(getAccessToken);
      setOrgs(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations.");
    } finally {
      setOrgsLoading(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!confirmOrg) return;
    const newStatus = confirmOrg.status === "suspended" ? "active" : "suspended";
    setActionLoading(confirmOrg.id);
    try {
      const updated = await updateOrganizationRequest(confirmOrg.id, { status: newStatus }, getAccessToken);
      setOrgs((prev) => prev.map((o) => (o.id === confirmOrg.id ? { ...o, status: updated.status } : o)));
      setConfirmOrg(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update organization.");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "staff")) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.role === "staff") fetchOrgs();
  }, [user?.role]);

  const allStatuses = [...new Set(orgs.map((o) => o.status).filter(Boolean))];

  const filtered = orgs.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.city?.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
      {/* Confirmation modal */}
      {confirmOrg && (
        <ConfirmStatusModal
          org={confirmOrg}
          onConfirm={handleConfirmToggle}
          onCancel={() => setConfirmOrg(null)}
          loading={actionLoading === confirmOrg.id}
        />
      )}

      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        <SiteNav className="mb-2" />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">Staff · all system organizations</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total",     value: orgs.length,                                          color: "border-t-primary" },
            { label: "Active",    value: orgs.filter((o) => o.status === "active").length,     color: "border-t-[var(--chart-1)]" },
            { label: "Suspended", value: orgs.filter((o) => o.status === "suspended").length,  color: "border-t-[var(--chart-5)]" },
            { label: "Pending",   value: orgs.filter((o) => o.status === "pending").length,    color: "border-t-[var(--chart-3)]" },
          ].map((k) => (
            <Card key={k.label} className={`border-t-2 ${k.color} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
              </CardHeader>
              <CardContent className="pt-0">
                {orgsLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-3xl font-bold">{k.value}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Status</span>
            {[{ value: null, label: "All" }, ...allStatuses.map((s) => ({ value: s, label: s }))].map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  statusFilter === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-sm text-muted-foreground">{filtered.length} of {orgs.length}</span>
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
              <Building2 className="size-4 text-muted-foreground" />
              Organization List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {orgsLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Building2 className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No organizations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">City</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((org) => (
                      <tr
                        key={org.id}
                        className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() => router.push(`/staff/organizations/${org.id}`)}
                      >
                        <td className="px-4 py-3 font-medium">{org.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{org.email || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{org.city || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={org.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{org.plan || "—"}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={actionLoading === org.id}
                            onClick={() => setConfirmOrg(org)}
                            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              org.status === "suspended"
                                ? "border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                                : "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            }`}
                          >
                            {actionLoading === org.id
                              ? "Processing..."
                              : org.status === "suspended" ? "Reactivate" : "Suspend"}
                          </button>
                        </td>
                      </tr>
                    ))}
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
