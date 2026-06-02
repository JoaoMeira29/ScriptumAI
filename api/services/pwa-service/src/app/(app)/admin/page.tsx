// STAFF ONLY — do not expose this route publicly
"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  BrainCircuit,
  Building2,
  ChevronRight,
  Clock,
  File,
  FileText,
  LayoutDashboard,
  Search,
  SortAsc,
  SortDesc,
  Upload,
  Users,
} from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import {
  getOrgMembersRequest,
  getOrgDocumentsRequest,
  getOrganizationRequest,
  updateUserRoleRequest,
  type OrgMember,
  type DocumentRecord,
} from "@/services/auth-api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "overview" | "users" | "content" | "logs";
type SortField = "name" | "email" | "role" | "status";
type SortDir = "asc" | "desc";

const BG =
  "min-h-screen bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background] text-foreground";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes?: number): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(d);
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />;
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    staff: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    user: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role] ?? styles.user}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "active"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

const ROLE_ORDER = ["staff", "admin", "user"];

function OverviewSection({
  users,
  loading,
  onNavigate,
}: {
  users: OrgMember[];
  loading: boolean;
  onNavigate: (s: Section, roleFilter?: string) => void;
}) {
  const stats = useMemo(() => {
    const byRole = users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {});
    const orgCount = new Set(users.map((u) => u.organization_id).filter(Boolean)).size;
    const active = users.filter((u) => u.status === "active").length;
    return { total: users.length, byRole, orgCount, active };
  }, [users]);

  const kpis: { label: string; value: number; sub: string; target: Section; roleFilter?: string }[] = [
    { label: "Total Users",   value: stats.total,             sub: `${stats.active} active`,  target: "users"                  },
    { label: "Admins",        value: stats.byRole.admin ?? 0, sub: "organization admins",      target: "users",  roleFilter: "admin" },
    { label: "Regular Users", value: stats.byRole.user ?? 0,  sub: "standard accounts",        target: "users",  roleFilter: "user"  },
    { label: "Organizations", value: stats.orgCount,          sub: "distinct orgs",            target: "content"                },
  ];

  const sortedByRole = useMemo(
    () =>
      Object.entries(stats.byRole).sort(
        ([a], [b]) =>
          (ROLE_ORDER.indexOf(a) === -1 ? 99 : ROLE_ORDER.indexOf(a)) -
          (ROLE_ORDER.indexOf(b) === -1 ? 99 : ROLE_ORDER.indexOf(b)),
      ),
    [stats.byRole],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card
            key={k.label}
            onClick={() => onNavigate(k.target, k.roleFilter)}
            className="cursor-pointer border-t-2 border-t-primary hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className="text-3xl font-bold">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Users by Role</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : sortedByRole.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-3">
              {sortedByRole.map(([role, count]) => (
                <div key={role} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <RoleBadge role={role} />
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function UsersSection({
  users,
  loading,
  onRoleChange,
  roleFilter: initialRoleFilter,
  orgNames,
}: {
  users: OrgMember[];
  loading: boolean;
  onRoleChange: (userId: string, newRole: string) => Promise<void>;
  roleFilter?: string | null;
  orgNames: Record<string, string>;
}) {
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter]   = useState<string | null>(initialRoleFilter ?? null);
  const [statusFilter, setStatus]     = useState<string | null>(null);
  const [orgFilter, setOrg]           = useState<string | null>(null);
  const [sortField, setSortField]     = useState<SortField>("name");
  const [sortDir, setSortDir]         = useState<SortDir>("asc");
  const [page, setPage]               = useState(0);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [roleEdits, setRoleEdits]     = useState<Record<string, string>>({});
  const [roleSaving, setRoleSaving]   = useState<string | null>(null);

  useEffect(() => {
    setRoleFilter(initialRoleFilter ?? null);
    setPage(0);
  }, [initialRoleFilter]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(0);
  }

  function setF<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(0);
  }

  const availableRoles    = useMemo(() => ROLE_ORDER.filter((r) => users.some((u) => u.role === r)), [users]);
  const availableStatuses = useMemo(() => [...new Set(users.map((u) => u.status).filter(Boolean))] as string[], [users]);
  const availableOrgs     = useMemo(() => {
    const ids = new Set(users.map((u) => u.organization_id).filter(Boolean)) as Set<string>;
    return [...ids].map((id) => ({ id, name: orgNames[id] || id.slice(0, 8) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, orgNames]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users
      .filter((u) => !roleFilter   || u.role === roleFilter)
      .filter((u) => !statusFilter || u.status === statusFilter)
      .filter((u) => !orgFilter    || u.organization_id === orgFilter)
      .filter((u) =>
        !q ||
        `${u.name} ${u.surname}`.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const av = ((sortField === "name" ? `${a.name} ${a.surname}` : a[sortField]) ?? "").toLowerCase();
        const bv = ((sortField === "name" ? `${b.name} ${b.surname}` : b[sortField]) ?? "").toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [users, search, roleFilter, statusFilter, orgFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageUsers  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const cols: { label: string; field: SortField }[] = [
    { label: "Name",   field: "name"   },
    { label: "Email",  field: "email"  },
    { label: "Role",   field: "role"   },
    { label: "Status", field: "status" },
  ];

  function FilterChips({ label, options, active, onSelect }: {
    label: string;
    options: { value: string | null; label: string }[];
    active: string | null;
    onSelect: (v: string | null) => void;
  }) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        {options.map(({ value, label: l }) => (
          <button
            key={l}
            onClick={() => setF(onSelect, value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
              active === value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setF(setSearch, e.target.value)}
          />
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} of {users.length} users
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <FilterChips
          label="Role"
          options={[{ value: null, label: "All" }, ...availableRoles.map((r) => ({ value: r, label: r }))]}
          active={roleFilter}
          onSelect={setRoleFilter}
        />
        {availableStatuses.length > 0 && (
          <FilterChips
            label="Status"
            options={[{ value: null, label: "All" }, ...availableStatuses.map((s) => ({ value: s, label: s }))]}
            active={statusFilter}
            onSelect={setStatus}
          />
        )}
        {availableOrgs.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Organization</span>
            <select
              value={orgFilter ?? ""}
              onChange={(e) => setF(setOrg, e.target.value || null)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="">All</option>
              {availableOrgs.map(({ id, name }) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {cols.map(({ label, field }) => (
                      <th
                        key={field}
                        onClick={() => toggleSort(field)}
                        className="cursor-pointer select-none px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {sortField === field ? (
                            sortDir === "asc" ? (
                              <SortAsc className="size-3" />
                            ) : (
                              <SortDesc className="size-3" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    pageUsers.map((u) => (
                      <Fragment key={u.id}>
                        <tr
                          className="cursor-pointer border-b border-border transition-colors hover:bg-muted/30"
                          onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                        >
                          <td className="px-4 py-3 font-medium">
                            {u.name} {u.surname}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={u.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {u.organization_id
                              ? (orgNames[u.organization_id] || `${u.organization_id.slice(0, 8)}…`)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <ChevronRight
                              className={`size-4 text-muted-foreground transition-transform ${expanded === u.id ? "rotate-90" : ""}`}
                            />
                          </td>
                        </tr>
                        {expanded === u.id && (
                          <tr className="bg-muted/20">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                                <div>
                                  <span className="text-muted-foreground">ID: </span>
                                  <span className="font-mono text-xs">{u.id}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Username: </span>
                                  {u.username ?? "—"}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Organization: </span>
                                  {u.organization_id
                                    ? (orgNames[u.organization_id] || "—")
                                    : "—"}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Organization ID: </span>
                                  <span className="font-mono text-xs">{u.organization_id ?? "—"}</span>
                                </div>
                              </div>
                              {u.role !== "staff" && (
                                <div className="mt-3 flex items-center gap-2">
                                  <select
                                    value={roleEdits[u.id] ?? u.role}
                                    onChange={(e) => setRoleEdits((prev) => ({ ...prev, [u.id]: e.target.value }))}
                                    disabled={roleSaving === u.id}
                                    className="rounded-md border border-border bg-background px-2 py-1.5 text-xs disabled:opacity-50"
                                  >
                                    <option value="admin">admin</option>
                                    <option value="user">user</option>
                                  </select>
                                  <button
                                    disabled={roleSaving === u.id || (roleEdits[u.id] ?? u.role) === u.role}
                                    onClick={async () => {
                                      const newRole = roleEdits[u.id] ?? u.role;
                                      if (!window.confirm(`Change ${u.name} ${u.surname}'s role to "${newRole}"?`))
                                        return;
                                      setRoleSaving(u.id);
                                      try {
                                        await onRoleChange(u.id, newRole);
                                      } finally {
                                        setRoleSaving(null);
                                      }
                                    }}
                                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {roleSaving === u.id ? "Saving…" : "Save"}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Documents Table ──────────────────────────────────────────────────────────

const DOC_PAGE_SIZE = 25;

const AI_STATUSES = [
  { value: null,        label: "All"       },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING",   label: "Pending"   },
  { value: "FAILED",    label: "Failed"    },
];

function AiStatusBadge({ status }: { status?: string | null }) {
  if (status === "COMPLETED")
    return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground">Completed</span>;
  if (status === "FAILED")
    return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Failed</span>;
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">Pending</span>;
}

function DocumentsTable({
  docs,
  loading,
  users,
  orgNames,
}: {
  docs: DocumentRecord[];
  loading: boolean;
  users: OrgMember[];
  orgNames: Record<string, string>;
}) {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<string | null>(null);
  const [orgFilter, setOrg]         = useState<string | null>(null);
  const [page, setPage]             = useState(0);

  const uploaderOrgId = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => { if (u.organization_id) map[u.id] = u.organization_id; });
    return map;
  }, [users]);

  const availableOrgs = useMemo(() => {
    const ids = new Set<string>();
    docs.forEach((d) => {
      const orgId = d.uploadedBy ? uploaderOrgId[d.uploadedBy] : undefined;
      if (orgId) ids.add(orgId);
    });
    return [...ids].map((id) => ({ id, name: orgNames[id] || id.slice(0, 8) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [docs, uploaderOrgId, orgNames]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter((d) => {
      if (statusFilter) {
        const normalised = (!d.aiStatus || d.aiStatus === "PENDING") ? "PENDING" : d.aiStatus;
        if (normalised !== statusFilter) return false;
      }
      if (orgFilter) {
        const orgId = d.uploadedBy ? uploaderOrgId[d.uploadedBy] : null;
        if (orgId !== orgFilter) return false;
      }
      if (q && !(d.originalName ?? d.fileName)?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [docs, statusFilter, orgFilter, search, uploaderOrgId]);

  const totalPages = Math.ceil(filtered.length / DOC_PAGE_SIZE);
  const pageItems  = filtered.slice(page * DOC_PAGE_SIZE, (page + 1) * DOC_PAGE_SIZE);

  function setFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(0);
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-border pb-3 space-y-3">
        {/* Title + search + count */}
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">Documents</CardTitle>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder="Search filename…"
              value={search}
              onChange={(e) => setFilter(setSearch, e.target.value)}
            />
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} docs</span>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Status</span>
            <div className="flex items-center gap-1">
              {AI_STATUSES.map(({ value, label }) => (
                <button
                  key={label}
                  onClick={() => setFilter(setStatus, value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                    statusFilter === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Organization */}
          {availableOrgs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Organization</span>
              <select
                value={orgFilter ?? ""}
                onChange={(e) => setFilter(setOrg, e.target.value || null)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="">All</option>
                {availableOrgs.map(({ id, name }) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : pageItems.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No documents</p>
        ) : (
          <ul className="divide-y divide-border">
            {pageItems.map((doc, i) => {
              const uploaderOrg = doc.uploadedBy ? uploaderOrgId[doc.uploadedBy] : null;
              const orgLabel = uploaderOrg ? (orgNames[uploaderOrg] || uploaderOrg.slice(0, 8)) : null;
              return (
                <li key={doc.id ?? i} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/30 transition-colors">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{doc.originalName ?? doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.fileName && <span className="font-mono">{doc.fileName}</span>}
                      {doc.fileName && <span> · </span>}
                      {formatSize(doc.size)}
                      {doc.uploadedByName && <span> · {doc.uploadedByName}</span>}
                      {orgLabel && <span> · {orgLabel}</span>}
                      {doc.createdAt && <span> · {formatDate(doc.createdAt)}</span>}
                    </p>
                  </div>
                  <AiStatusBadge status={doc.aiStatus} />
                </li>
              );
            })}
          </ul>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
                Previous
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

function ContentSection({
  docs,
  docsLoading,
  users,
  orgNames,
}: {
  docs: DocumentRecord[];
  docsLoading: boolean;
  users: OrgMember[];
  orgNames: Record<string, string>;
}) {
  const docStats = useMemo(() => {
    const total = docs.length;
    const processed = docs.filter((d) => d.aiStatus === "COMPLETED").length;
    const pending = docs.filter((d) => !d.aiStatus || d.aiStatus === "PENDING").length;
    const failed = docs.filter((d) => d.aiStatus === "FAILED").length;
    const totalSize = docs.reduce((s, d) => s + (d.size ?? 0), 0);
    const byType: Record<string, number> = {};
    docs.forEach((d) => {
      const t =
        d.mimeType === "application/pdf"
          ? "PDF"
          : d.mimeType?.startsWith("image/")
            ? "Image"
            : d.mimeType?.startsWith("text/")
              ? "Text"
              : "Other";
      byType[t] = (byType[t] ?? 0) + 1;
    });
    return { total, processed, pending, failed, totalSize, byType };
  }, [docs]);

  const orgStats = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => {
      if (!u.organization_id) return;
      map.set(u.organization_id, (map.get(u.organization_id) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Document KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Docs", value: docStats.total, sub: formatSize(docStats.totalSize), icon: FileText },
          { label: "AI Processed", value: docStats.processed, sub: "completed", icon: BrainCircuit },
          { label: "AI Pending", value: docStats.pending, sub: "awaiting", icon: BrainCircuit },
          { label: "AI Failed", value: docStats.failed, sub: "errors", icon: File },
        ].map((k) => (
          <Card key={k.label} className="border-t-2 border-t-primary hover:shadow-md transition-shadow">
            <CardHeader className="pb-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <k.icon className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">{k.label}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {docsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className="text-3xl font-bold">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Doc types */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Documents by Type</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {docsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : Object.keys(docStats.byType).length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(docStats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3 text-sm">
                    <span className="w-14 font-medium">{type}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${docStats.total ? (count / docStats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orgs by user count */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-muted-foreground" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {orgStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <ul className="divide-y divide-border">
                {orgStats.map(({ id, count }) => (
                  <li key={id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-muted-foreground">
                      {orgNames[id] || `${id.slice(0, 8)}…`}
                    </span>
                    <span className="font-medium">
                      {count} {count === 1 ? "user" : "users"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <DocumentsTable docs={docs} loading={docsLoading} users={users} orgNames={orgNames} />
    </div>
  );
}

// ─── User Logs ────────────────────────────────────────────────────────────────

function UserLogsSection({
  docs,
  docsLoading,
  users,
}: {
  docs: DocumentRecord[];
  docsLoading: boolean;
  users: OrgMember[];
}) {
  const logs = useMemo(() => {
    return [...docs]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      .map((doc) => {
        const member = users.find((u) => u.id === doc.uploadedBy);
        const uploaderName = doc.uploadedByName ?? (member ? `${member.name} ${member.surname}` : "Unknown user");
        const initials = member ? `${member.name?.[0] ?? ""}${member.surname?.[0] ?? ""}`.toUpperCase() : "?";
        return { doc, uploaderName, initials };
      });
  }, [docs, users]);

  function formatDateTime(iso?: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4 text-muted-foreground" />
          User Logs
          {!docsLoading && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">{logs.length} events</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {docsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Upload className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {logs.map(({ doc, uploaderName, initials }, i) => (
              <li
                key={doc.id ?? i}
                className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{uploaderName}</span>
                    <span className="text-muted-foreground"> uploaded </span>
                    <span className="font-medium truncate">{doc.originalName ?? doc.fileName}</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDateTime(doc.createdAt)}
                    {doc.size != null && <span className="ml-2">{formatSize(doc.size)}</span>}
                  </p>
                </div>
                <span
                  className={`mt-0.5 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.aiStatus === "COMPLETED"
                      ? "bg-primary text-primary-foreground"
                      : doc.aiStatus === "FAILED"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {doc.aiStatus === "COMPLETED" ? "Processed" : doc.aiStatus === "FAILED" ? "Failed" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "content", label: "Content", icon: FileText },
  { id: "logs", label: "User Logs", icon: Clock },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { isAuthenticated, isLoading, user, getAccessToken } = useAuth();
  const router = useRouter();

  const [section, setSection] = useState<Section>("overview");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [users, setUsers] = useState<OrgMember[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [orgNames, setOrgNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (usersLoading || !users.length) return;
    const token = getAccessToken();
    if (!token) return;
    const uniqueIds = [...new Set(users.map((u) => u.organization_id).filter(Boolean))] as string[];
    Promise.all(
      uniqueIds.map((id) =>
        getOrganizationRequest(id, token)
          .then((org) => [id, org.name] as const)
          .catch(() => [id, ""] as const),
      ),
    ).then((pairs) => setOrgNames(Object.fromEntries(pairs)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersLoading]);

  function navigate(s: Section, filter?: string) {
    setSection(s);
    setRoleFilter(filter ?? null);
  }

  const isAllowed = user?.role === "staff" || user?.role === "admin";

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAllowed)) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isAllowed, router]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user || !isAllowed) return;
    const orgId = user.organization_id;

    setUsersLoading(true);
    setDocsLoading(true);

    getOrgMembersRequest(getAccessToken)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));

    if (orgId) {
      getOrgDocumentsRequest(orgId, getAccessToken)
        .then((list) => setDocs(Array.isArray(list) ? list : []))
        .catch(() => setDocs([]))
        .finally(() => setDocsLoading(false));
    } else {
      setDocsLoading(false);
    }
  }, [user?.id]);

  if (isLoading || !isAuthenticated || !isAllowed) {
    return (
      <main className={BG}>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
          <div className="h-64 rounded-lg bg-muted" />
        </div>
      </main>
    );
  }

  return (
    <main className={BG}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        <SiteNav className="mb-2" />

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground">Staff-only · internal use only</p>
        </div>

        {/* Horizontal tab nav */}
        <div className="flex overflow-x-auto border-b border-border gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                section === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Section content */}
        {section === "overview" && <OverviewSection users={users} loading={usersLoading} onNavigate={navigate} />}
        {section === "users" && (
          <UsersSection
            users={users}
            loading={usersLoading}
            roleFilter={roleFilter}
            orgNames={orgNames}
            onRoleChange={async (userId, newRole) => {
              await updateUserRoleRequest(userId, newRole, getAccessToken);
              setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
            }}
          />
        )}
        {section === "content" && <ContentSection docs={docs} docsLoading={docsLoading} users={users} orgNames={orgNames} />}
        {section === "logs" && <UserLogsSection docs={docs} docsLoading={docsLoading} users={users} />}
      </div>
    </main>
  );
}