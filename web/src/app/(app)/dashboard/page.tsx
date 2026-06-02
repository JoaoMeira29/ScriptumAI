"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  File,
  FileImage,
  FileText,
  Mail,
  HardDrive,
  Search,
  UserRound,
} from "lucide-react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { SiteNav } from "@/components/site-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import {
  getOrganizationRequest,
  getOrgDocumentsRequest,
  getOrgDocumentsPaginatedRequest,
  getOrgInvitesRequest,
  getDepartmentsRequest,
  getOrgMembersRequest,
  getOrgMembersPaginatedRequest,
  type OrganizationDetail,
  type DocumentRecord,
  type Department,
  type OrgMember,
} from "@/services/auth-api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function formatSize(bytes?: number): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Chart colors — CSS custom properties work in inline SVG fill attributes ──

const C = {
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
  muted:  "var(--muted)",
} as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "muted" | "role";
}) {
  const classes: Record<string, string> = {
    primary: "bg-primary text-primary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full",
    muted:   "bg-muted text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full",
    role:    "border border-primary/30 bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full",
  };
  return <span className={classes[variant]}>{children}</span>;
}

// ─── KPI: Documents ──────────────────────────────────────────────────────────

function DocumentsKpi({ total, loading }: { total: number | null; loading: boolean }) {
  const cap = 100;
  const pct = total != null ? Math.min((total / cap) * 100, 100) : 0;

  return (
    <Card className="h-full border-t-2 border-t-[var(--chart-1)] hover:shadow-md transition-shadow">
      <CardHeader className="pb-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Documents</span>
        </div>
      </CardHeader>
      <CardContent className="pt-1 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full" />
          </>
        ) : (
          <>
            <span className="text-3xl font-bold">{total ?? "--"}</span>
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: "var(--chart-1)" }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{total ?? 0} of {cap} documents</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── KPI: AI Processed (small donut) ─────────────────────────────────────────

function AiProcessedKpi({
  processed,
  total,
  loading,
}: {
  processed: number | null;
  total: number | null;
  loading: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pct =
    processed != null && total != null && total > 0
      ? Math.round((processed / total) * 100)
      : 0;

  const data = useMemo(() => {
    const p = processed ?? 0;
    const t = total ?? 0;
    if (t === 0) return [{ name: "Pending", value: 1, fill: C.muted }];
    return [
      { name: "Processed", value: p,     fill: C.chart1 },
      { name: "Pending",   value: t - p, fill: C.muted  },
    ];
  }, [processed, total]);

  return (
    <Card className="h-full border-t-2 border-t-[var(--chart-1)] hover:shadow-md transition-shadow">
      <CardHeader className="pb-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BrainCircuit className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wide">AI Processed</span>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        {!mounted || loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="size-[72px] rounded-full" />
            <Skeleton className="h-6 w-12" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
              <PieChart width={72} height={72}>
                <Pie
                  data={data}
                  cx={31}
                  cy={31}
                  innerRadius={24}
                  outerRadius={34}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                />
              </PieChart>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {total != null && total > 0 ? `${pct}%` : "--"}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {processed ?? "--"}
                <span className="text-sm font-normal text-muted-foreground">
                  {total != null ? ` / ${total}` : ""}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">docs processed</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── KPI: AI Pending ─────────────────────────────────────────────────────────

function PendingKpi({ pending, loading }: { pending: number | null; loading: boolean }) {
  const hasPending = pending != null && pending > 0;
  return (
    <Card className="h-full border-t-2 border-t-[var(--chart-5)] hover:shadow-md transition-shadow">
      <CardHeader className="pb-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BrainCircuit className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wide">AI Pending</span>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="space-y-1">
            <span
              className="text-3xl font-bold"
              style={{ color: hasPending ? "var(--chart-5)" : undefined }}
            >
              {pending ?? "--"}
            </span>
            <p className="text-xs text-muted-foreground">
              {hasPending ? "awaiting processing" : "all processed"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── KPI: Invites ────────────────────────────────────────────────────────────

function InvitesKpi({ count, loading }: { count: number | null; loading: boolean }) {
  const hasInvites = count != null && count > 0;
  return (
    <Card className="h-full border-t-2 border-t-[var(--chart-3)] hover:shadow-md transition-shadow">
      <CardHeader className="pb-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Invites</span>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
              style={{
                background: hasInvites ? "color-mix(in oklch, var(--chart-3) 15%, transparent)" : "var(--muted)",
                boxShadow: hasInvites
                  ? "0 0 0 3px color-mix(in oklch, var(--chart-3) 40%, transparent)"
                  : "0 0 0 3px var(--muted)",
                color: hasInvites ? "var(--chart-3)" : "var(--muted-foreground)",
              }}
            >
              {count ?? "--"}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                {hasInvites ? "awaiting response" : "no invites"}
              </p>
              {hasInvites && (
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ background: "var(--chart-3)" }}
                >
                  Pending
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── KPI: Total Size ─────────────────────────────────────────────────────────

function StorageKpi({ docs, loading }: { docs: DocumentRecord[]; loading: boolean }) {
  const totalBytes = docs.reduce((s, d) => s + (d.size ?? 0), 0);
  return (
    <Card className="h-full border-t-2 border-t-[var(--chart-4)] hover:shadow-md transition-shadow">
      <CardHeader className="pb-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <HardDrive className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Storage</span>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="space-y-1">
            <span className="text-3xl font-bold">{formatSize(totalBytes) || "0 B"}</span>
            <p className="text-xs text-muted-foreground">total file size</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Chart: AI Donut (large) ─────────────────────────────────────────────────

function AiDonutChart({
  processed,
  total,
  loading,
}: {
  processed: number | null;
  total: number | null;
  loading: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pending = (total ?? 0) - (processed ?? 0);
  const pct =
    processed != null && total != null && total > 0
      ? Math.round((processed / total) * 100)
      : null;

  const data = useMemo(() => {
    if (!total) return [{ name: "No data", value: 1, fill: C.muted }];
    return [
      { name: "Processed", value: processed ?? 0, fill: C.chart1 },
      { name: "Pending",   value: pending,         fill: C.chart3 },
    ];
  }, [processed, total, pending]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BrainCircuit className="size-4 text-muted-foreground" />
          AI Processing
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!mounted || loading ? (
          <div className="flex items-center justify-center h-48">
            <Skeleton className="size-36 rounded-full" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: 180, height: 180 }}>
              <PieChart width={180} height={180}>
                <Pie
                  data={data}
                  cx={80}
                  cy={80}
                  innerRadius={54}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="var(--card)"
                />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [`${v} docs`, name as string]}
                  contentStyle={{
                    fontSize: 12,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--card-foreground)",
                  }}
                />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">
                  {pct != null ? `${pct}%` : "--"}
                </span>
                <span className="text-xs text-muted-foreground">processed</span>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-full" style={{ background: C.chart1 }} />
                <span>Processed <strong>{processed ?? "--"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-full" style={{ background: C.chart3 }} />
                <span>Pending <strong>{total != null ? pending : "--"}</strong></span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Chart: Document Types (bar) ─────────────────────────────────────────────

function DocTypesChart({ docs, loading }: { docs: DocumentRecord[]; loading: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    const pdf    = docs.filter((d) => d.mimeType === "application/pdf").length;
    const images = docs.filter((d) => d.mimeType?.startsWith("image/")).length;
    const text   = docs.filter((d) => d.mimeType?.startsWith("text/")).length;
    const others = docs.length - pdf - images - text;
    return [
      { name: "PDF",    value: pdf,    fill: C.chart1 },
      { name: "Images", value: images, fill: C.chart2 },
      { name: "Text",   value: text,   fill: C.chart3 },
      { name: "Other",  value: others, fill: C.chart4 },
    ].filter((d) => d.value > 0);
  }, [docs]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <File className="size-4 text-muted-foreground" />
          Document Types
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!mounted || loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <FileText className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No documents</p>
          </div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={180} minWidth={0}>
              <BarChart
                data={data}
                margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                barSize={28}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: unknown) => [`${v} docs`]}
                  contentStyle={{
                    fontSize: 12,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--card-foreground)",
                  }}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Members card (admin only) ───────────────────────────────────────────────

const MEMBERS_PAGE_SIZE = 5;

function MembersCard({
  departments,
  orgId,
  getAccessToken,
  onDeptChange,
}: {
  departments: Department[];
  orgId: string;
  getAccessToken: () => string | null;
  onDeptChange: () => void;
}) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    getOrgMembersPaginatedRequest(page, MEMBERS_PAGE_SIZE, debouncedSearch, getAccessToken)
      .then(({ data, pagination }) => {
        setMembers(Array.isArray(data) ? data : []);
        setTotalPages(pagination.totalPages ?? 1);
        setTotal(pagination.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  const memberDeptMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const dept of departments) {
      const deptWithMembers = dept as Department & { members?: Array<{ userId: string }> };
      if (deptWithMembers.members) {
        for (const m of deptWithMembers.members) {
          if (!map.has(m.userId)) map.set(m.userId, new Set());
          map.get(m.userId)!.add(dept.id);
        }
      }
    }
    return map;
  }, [departments]);

  const toggleDepartment = async (userId: string, deptId: string, isIn: boolean) => {
    setSaving(true);
    try {
      if (isIn) {
        const { removeDepartmentMemberRequest } = await import("@/services/auth-api");
        await removeDepartmentMemberRequest(orgId, deptId, userId, getAccessToken);
      } else {
        const { addDepartmentMemberRequest } = await import("@/services/auth-api");
        await addDepartmentMemberRequest(orgId, deptId, userId, getAccessToken);
      }
      onDeptChange();
    } catch {
      // silently fail — user will see the state didn't change
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          Organization Users
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        )}
        {!loading && total === 0 && !debouncedSearch && (
          <p className="text-sm text-muted-foreground">No users found.</p>
        )}
        {!loading && total === 0 && debouncedSearch && (
          <p className="text-sm text-muted-foreground py-4 text-center">No users match your search.</p>
        )}
        {!loading && members.length > 0 && (
          <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {members.map((m) => {
              const userDepts = memberDeptMap.get(m.id) ?? new Set<string>();
              const userDeptNames = departments.filter((d) => userDepts.has(d.id)).map((d) => d.name);
              const isEditing = editingUser === m.id;

              return (
                <li key={m.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold uppercase text-primary-foreground">
                      {m.name?.[0]}{m.surname?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.name} {m.surname}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Badge variant="role">{m.role}</Badge>
                    {m.status && (
                      <Badge variant={m.status === "active" ? "primary" : "muted"}>{m.status}</Badge>
                    )}
                  </div>
                  <div className="mt-2 ml-11 flex flex-wrap items-center gap-1.5">
                    {userDeptNames.length > 0 ? (
                      userDeptNames.map((name) => (
                        <span key={name} className="inline-block rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No departments</span>
                    )}
                    {departments.length > 0 && (
                      <button
                        onClick={() => setEditingUser(isEditing ? null : m.id)}
                        className="inline-flex items-center rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        {isEditing ? "Done" : "Edit"}
                      </button>
                    )}
                  </div>
                  {isEditing && (
                    <div className="mt-2 ml-11 flex flex-wrap gap-2">
                      {departments.map((dept) => {
                        const isIn = userDepts.has(dept.id);
                        return (
                          <button
                            key={dept.id}
                            disabled={saving}
                            onClick={() => toggleDepartment(m.id, dept.id, isIn)}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors disabled:opacity-50 ${
                              isIn
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                            }`}
                          >
                            {isIn ? `- ${dept.name}` : `+ ${dept.name}`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {total} users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-xs font-medium tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Documents card with server-side pagination ──────────────────────────────

const DOC_PAGE_SIZE = 5;

function DocumentsCard({
  getAccessToken,
  members,
  canSeeMembers,
}: {
  getAccessToken: () => string | null;
  members: OrgMember[];
  canSeeMembers: boolean;
}) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    getOrgDocumentsPaginatedRequest(page, DOC_PAGE_SIZE, getAccessToken)
      .then(({ data, pagination }) => {
        setDocs(Array.isArray(data) ? data : []);
        setTotalPages(pagination.totalPages ?? 1);
        setTotal(pagination.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const visible = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter((d) => (d.originalName ?? d.fileName)?.toLowerCase().includes(q));
  }, [docs, search]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Documents</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {!loading && total > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        )}
        {!loading && total === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <FileText className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No documents</p>
          </div>
        )}
        {!loading && total > 0 && visible.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No documents match your search.</p>
        )}
        {!loading && visible.length > 0 && (
          <ul className="space-y-3">
            {visible.map((doc, i) => {
              const uploaderName = canSeeMembers
                ? (() => {
                    if (doc.uploadedByName) return doc.uploadedByName;
                    const m = members.find((m) => m.id === doc.uploadedBy);
                    return m ? `${m.name} ${m.surname}` : null;
                  })()
                : null;
              return (
                <li key={doc.id ?? i} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors text-sm">
                  <DocIcon mime={doc.mimeType} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{doc.originalName ?? doc.fileName}</span>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {doc.fileName && (
                        <span className="text-xs text-muted-foreground font-mono">{doc.fileName}</span>
                      )}
                      {doc.size != null && (
                        <span className="text-xs text-muted-foreground">{formatSize(doc.size)}</span>
                      )}
                      {uploaderName && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <UserRound className="size-3" />
                          {uploaderName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={doc.aiStatus === "COMPLETED" ? "primary" : "muted"}>
                      {doc.aiStatus === "COMPLETED" ? "AI Processed" : doc.aiStatus === "FAILED" ? "AI Error" : "Pending"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {total} documents
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-xs font-medium tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Org row ──────────────────────────────────────────────────────────────────

function OrgRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

// ─── File icon ────────────────────────────────────────────────────────────────

function DocIcon({ mime }: { mime?: string }) {
  if (mime?.startsWith("image/")) return <FileImage className="size-4 shrink-0 text-muted-foreground" />;
  if (mime === "application/pdf" || mime?.startsWith("text/"))
    return <FileText className="size-4 shrink-0 text-muted-foreground" />;
  return <File className="size-4 shrink-0 text-muted-foreground" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const BG = "min-h-screen bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background] text-foreground";

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user, trial, getAccessToken } = useAuth();
  const router = useRouter();

  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(true);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  const [inviteCount, setInviteCount] = useState<number | null>(null);
  const [invitesLoading, setInvitesLoading] = useState(true);

  const [members, setMembers] = useState<OrgMember[]>([]);

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const canSeeMembers = isAdmin || isStaff;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user?.organization_id) return;
    const orgId = user.organization_id;

    async function fetchAll() {
      const token = getAccessToken();
      if (!token) return;

      const canFetchMembers = user?.role === "admin" || user?.role === "staff";

      const [orgRes, docsRes, invitesRes, deptsRes, membersRes] = await Promise.allSettled([
        getOrganizationRequest(orgId, token),
        getOrgDocumentsRequest(orgId, getAccessToken),
        canFetchMembers ? getOrgInvitesRequest(orgId, getAccessToken) : Promise.resolve([]),
        getDepartmentsRequest(orgId, getAccessToken),
        canFetchMembers ? getOrgMembersRequest(getAccessToken) : Promise.resolve([]),
      ]);

      if (orgRes.status === "fulfilled") setOrg(orgRes.value);
      else setOrgError(true);
      setOrgLoading(false);

      if (deptsRes.status === "fulfilled") {
        setDepartments(Array.isArray(deptsRes.value) ? deptsRes.value : []);
      }
      setDeptsLoading(false);

      if (docsRes.status === "fulfilled") {
        const list = Array.isArray(docsRes.value) ? docsRes.value : [];
        setDocuments(list);
      }
      setDocsLoading(false);

      if (invitesRes.status === "fulfilled") {
        const list = Array.isArray(invitesRes.value) ? invitesRes.value : [];
        setInviteCount(list.length);
      } else {
        setInviteCount(null);
      }
      setInvitesLoading(false);

      if (membersRes.status === "fulfilled") {
        setMembers(Array.isArray(membersRes.value) ? membersRes.value : []);
      }
    }

    fetchAll();
  }, [user?.organization_id, getAccessToken]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className={BG}>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-lg bg-muted" />)}
            <div className="col-span-2 sm:col-span-1 h-28 rounded-lg bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <div key={i} className="h-64 rounded-lg bg-muted" />)}
          </div>
        </div>
      </main>
    );
  }

  const docTotal = docsLoading ? null : documents.length;
  const docAI    = docsLoading ? null : documents.filter((d) => d.aiStatus === "COMPLETED").length;
  const docPending = docAI != null && docTotal != null ? docTotal - docAI : null;

  return (
    <main className={BG}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">

        <SiteNav className="mb-2" />

        {/* Trial banner */}
        {trial?.status === "trialing" && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Trial:</strong> {trial.days_remaining ?? "--"} days remaining
          </div>
        )}

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {user?.name} {user?.surname}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{user?.email}</span>
            {user?.role && <Badge variant="role">{user.role}</Badge>}
          </div>
        </div>

        {/* KPI row */}
        <div className={`grid grid-cols-2 gap-4 ${canSeeMembers ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
          <DocumentsKpi  total={docTotal}               loading={docsLoading}    />
          <AiProcessedKpi processed={docAI} total={docTotal} loading={docsLoading} />
          <PendingKpi    pending={docPending}            loading={docsLoading}    />
          {canSeeMembers && (
            <Link href={isAdmin ? "/admin/invites" : "/invites"} className="block h-full hover:opacity-90 transition-opacity">
              <InvitesKpi count={inviteCount} loading={invitesLoading} />
            </Link>
          )}
          <div className={`${canSeeMembers ? "col-span-2 sm:col-span-1" : ""} h-full`}>
            <StorageKpi docs={documents} loading={docsLoading} />
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AiDonutChart processed={docAI} total={docTotal} loading={docsLoading} />
          <DocTypesChart docs={documents} loading={docsLoading} />
        </div>

        {/* Organization card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {orgLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            )}
            {!orgLoading && orgError && (
              <p className="text-sm text-destructive">
                Unable to load organization data.
              </p>
            )}
            {!orgLoading && !orgError && org && (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <OrgRow label="Name">{org.name || "--"}</OrgRow>
                  <OrgRow label="Email">{org.email || "--"}</OrgRow>
                  <OrgRow label="City">{org.city || "--"}</OrgRow>
                  <OrgRow label="Address">{org.address || "--"}</OrgRow>
                  <OrgRow label="Contact">{org.contact ?? "--"}</OrgRow>
                  <OrgRow label="ZIP Code">{org.zipCode || "--"}</OrgRow>
                  <OrgRow label="Status">
                    <Badge variant={org.status === "active" ? "primary" : "muted"}>
                      {org.status}
                    </Badge>
                  </OrgRow>
                  <OrgRow label="Created at">{formatDate(org.createdAt)}</OrgRow>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Departments</p>
                  {deptsLoading ? (
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ) : departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No departments</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {departments.map((d) => (
                        <Badge key={d.id} variant="muted">{d.name}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Members (admin/staff only) */}
        {canSeeMembers && (
          <MembersCard
            departments={departments}
            orgId={user?.organization_id ?? ""}
            getAccessToken={getAccessToken}
            onDeptChange={() => {
              if (!user?.organization_id) return;
              getDepartmentsRequest(user.organization_id, getAccessToken)
                .then((res) => setDepartments(Array.isArray(res) ? res : []))
                .catch(() => {});
            }}
          />
        )}

        {/* Documents table */}
        <DocumentsCard
          getAccessToken={getAccessToken}
          members={members}
          canSeeMembers={canSeeMembers}
        />

      </div>
    </main>
  );
}
