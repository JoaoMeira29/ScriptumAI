"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Pencil, Trash2, Plus, UserPlus, X } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import {
  getDepartmentsRequest,
  createDepartmentRequest,
  updateDepartmentRequest,
  deleteDepartmentRequest,
  addDepartmentMemberRequest,
  removeDepartmentMemberRequest,
  getOrgMembersRequest,
  type DepartmentWithMembers,
  type OrgMember,
} from "@/services/auth-api";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />;
}

function Badge({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "muted";
}) {
  const classes: Record<string, string> = {
    primary: "bg-primary text-primary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full",
    muted: "bg-muted text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full",
  };
  return <span className={classes[variant]}>{children}</span>;
}

const BG =
  "min-h-screen bg-gradient-to-b from-sky-100 via-cyan-50 to-white dark:from-[--background] dark:via-[--card] dark:to-[--background] text-foreground";

// ─── Create/Edit Department Dialog ──────────────────────────────────────────

function DepartmentFormDialog({
  orgId,
  getAccessToken,
  existing,
  onSaved,
  children,
}: {
  orgId: string;
  getAccessToken: () => string | null;
  existing?: DepartmentWithMembers;
  onSaved: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName(existing?.name ?? "");
    setDescription(existing?.description ?? "");
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (existing) {
        await updateDepartmentRequest(orgId, existing.id, { name: name.trim(), description: description.trim() || undefined }, getAccessToken);
      } else {
        await createDepartmentRequest(orgId, { name: name.trim(), description: description.trim() || undefined }, getAccessToken);
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="contents">
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Department" : "New Department"}</DialogTitle>
          <DialogDescription>
            {existing ? "Update department details." : "Create a new department for your organization."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dept-name">Name</Label>
              <Input
                id="dept-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering"
                required
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dept-desc">Description</Label>
              <Input
                id="dept-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Saving..." : existing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Member Dialog ──────────────────────────────────────────────────────

function AddMemberDialog({
  orgId,
  departmentId,
  existingMemberUserIds,
  orgMembers,
  getAccessToken,
  onAdded,
}: {
  orgId: string;
  departmentId: string;
  existingMemberUserIds: Set<string>;
  orgMembers: OrgMember[];
  getAccessToken: () => string | null;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const availableMembers = orgMembers.filter((m) => !existingMemberUserIds.has(m.id));

  const filtered = search.trim()
    ? availableMembers.filter((m) => {
        const q = search.toLowerCase();
        return m.name?.toLowerCase().includes(q) || m.surname?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
      })
    : availableMembers;

  const handleAdd = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await addDepartmentMemberRequest(orgId, departmentId, userId, getAccessToken);
      setOpen(false);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setSearch(""); }}>
      <DialogTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted transition-colors">
        <UserPlus className="size-3" />
        Add
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>Select a user to add to this department.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          {availableMembers.length > 0 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          )}
          <div className="max-h-64 overflow-y-auto space-y-2">
          {availableMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">All organization members are already in this department.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No users match your search.</p>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => handleAdd(m.id)}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors text-sm disabled:opacity-50"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold uppercase text-primary-foreground text-xs">
                  {m.name?.[0]}{m.surname?.[0]}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium">{m.name} {m.surname}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
              </button>
            ))
          )}
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const { isAuthenticated, isLoading, user, getAccessToken } = useAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<DepartmentWithMembers[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const fetchData = async () => {
    if (!user?.organization_id) return;
    setDeptsLoading(true);

    const [deptsRes, membersRes] = await Promise.allSettled([
      getDepartmentsRequest(user.organization_id, getAccessToken),
      getOrgMembersRequest(getAccessToken),
    ]);

    if (deptsRes.status === "fulfilled") {
      setDepartments(Array.isArray(deptsRes.value) ? deptsRes.value : []);
      setError(null);
    } else {
      setError("Failed to load departments");
    }

    if (membersRes.status === "fulfilled") {
      setOrgMembers(Array.isArray(membersRes.value) ? membersRes.value : []);
    }

    setDeptsLoading(false);
  };

  const handleDelete = async (deptId: string, deptName: string) => {
    if (!user?.organization_id) return;
    if (!window.confirm(`Delete department "${deptName}"? This action cannot be undone.`)) return;

    try {
      await deleteDepartmentRequest(user.organization_id, deptId, getAccessToken);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete department");
    }
  };

  const handleRemoveMember = async (deptId: string, userId: string) => {
    if (!user?.organization_id) return;
    try {
      await removeDepartmentMemberRequest(user.organization_id, deptId, userId, getAccessToken);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) router.replace("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    fetchData();
  }, [user?.organization_id]);

  if (isLoading || !isAuthenticated || !isAdmin) {
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

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
            <p className="text-sm text-muted-foreground">
              Manage departments and their members
            </p>
          </div>
          {user?.organization_id && (
            <DepartmentFormDialog
              orgId={user.organization_id}
              getAccessToken={getAccessToken}
              onSaved={fetchData}
            >
              <span className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium px-2.5 py-2 hover:bg-primary/90 transition-all cursor-pointer">
                <Plus className="size-4 mr-2" />
                New Department
              </span>
            </DepartmentFormDialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border-t-2 border-t-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Departments</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {deptsLoading ? <Skeleton className="h-7 w-12" /> : <span className="text-2xl font-bold">{departments.length}</span>}
            </CardContent>
          </Card>
          <Card className="border-t-2 border-t-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Total Assignments</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {deptsLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <span className="text-2xl font-bold">{departments.reduce((s, d) => s + (d.members?.length ?? 0), 0)}</span>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Departments List */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">All Departments</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {deptsLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            )}

            {!deptsLoading && departments.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Building2 className="size-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No departments yet</p>
              </div>
            )}

            {!deptsLoading && departments.length > 0 && (
              <div className="space-y-3">
                {departments.map((dept) => {
                  const isExpanded = expandedDept === dept.id;
                  const memberUserIds = new Set(dept.members?.map((m) => m.userId) ?? []);
                  const memberDetails = orgMembers.filter((m) => memberUserIds.has(m.id));

                  return (
                    <div key={dept.id} className="rounded-lg border border-border overflow-hidden">
                      <div
                        className="flex flex-col gap-2 p-4 hover:bg-muted/30 transition-colors cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                        onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Building2 className="size-5 shrink-0 text-muted-foreground mt-0.5" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{dept.name}</span>
                              <Badge variant="muted">{dept.members?.length ?? 0} members</Badge>
                            </div>
                            {dept.description && (
                              <p className="text-xs text-muted-foreground">{dept.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:shrink-0" onClick={(e) => e.stopPropagation()}>
                          {user?.organization_id && (
                            <DepartmentFormDialog
                              orgId={user.organization_id}
                              getAccessToken={getAccessToken}
                              existing={dept}
                              onSaved={fetchData}
                            >
                              <span className="inline-flex rounded-md border border-border bg-background p-1.5 hover:bg-muted transition-colors cursor-pointer">
                                <Pencil className="size-3.5" />
                              </span>
                            </DepartmentFormDialog>
                          )}
                          <button
                            onClick={() => handleDelete(dept.id, dept.name)}
                            className="rounded-md border border-red-300 bg-background p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/10 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Members</span>
                            {user?.organization_id && (
                              <AddMemberDialog
                                orgId={user.organization_id}
                                departmentId={dept.id}
                                existingMemberUserIds={memberUserIds}
                                orgMembers={orgMembers}
                                getAccessToken={getAccessToken}
                                onAdded={fetchData}
                              />
                            )}
                          </div>
                          {memberDetails.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No members assigned yet.</p>
                          ) : (
                            <ul className="space-y-2">
                              {memberDetails.map((m) => (
                                <li key={m.id} className="flex items-center gap-3 text-sm">
                                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold uppercase text-primary-foreground text-xs">
                                    {m.name?.[0]}{m.surname?.[0]}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="font-medium">{m.name} {m.surname}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveMember(dept.id, m.id)}
                                    className="rounded-md p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
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
