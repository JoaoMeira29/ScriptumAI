const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

//  Types

type ApiErrorPayload = {
  success?: boolean;
  error?: string;
  message?: string;
  trial_ended_at?: string;
  errors?: Array<{ msg: string; path?: string }>;
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  trialEndedAt?: string;

  constructor(message: string, status: number, code?: string, trialEndedAt?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.trialEndedAt = trialEndedAt;
  }
}

export type User = {
  id: string;
  email: string;
  username: string;
  name: string;
  surname: string;
  role: string;
  organization_id: string;
  status?: string;
};

export type Trial = {
  status?: string;
  ends_at?: string;
  days_remaining?: number;
};

export type Organization = {
  id: string;
  name: string;
};

export type OrganizationDetail = {
  id: string;
  name: string;
  email?: string;
  city?: string;
  address?: string;
  contact?: number;
  zipCode?: string;
  status: string;
  createdAt?: string;
};

export type Department = {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MembershipRecord = {
  id: string;
  user_id: string;
  organization_id: string;
  role?: string;
  status?: string;
};

export type MembersResponse = {
  data?: MembershipRecord[];
  members?: MembershipRecord[];
  count?: number;
};

export type DocumentStats = {
  total: number;
  ai_processed: number;
};

export type DocumentStatsResponse = {
  data?: DocumentStats;
  total?: number;
  ai_processed?: number;
};

export type DocPagination = {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
};

export type DocumentRecord = {
  id: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  aiStatus?: string | null;
  uploadedBy?: string;
  uploadedByName?: string;
  createdAt?: string;
};

export type DocumentsResponse = {
  data?: DocumentRecord[];
  documents?: DocumentRecord[];
};

export type InviteRecord = {
  id: string;
  email?: string;
  role?: string;
  token?: string;
  organizationId?: string;
  expiresAt?: string;
};

export type InvitesResponse = {
  data?: InviteRecord[];
  invites?: InviteRecord[];
  count?: number;
};

export type AuthLog = {
  id?: string;
  action: string;
  ip_address?: string;
  success: boolean;
  created_at?: string;
};

export type AuthLogsResponse = {
  data?: AuthLog[];
  logs?: AuthLog[];
};

type AuthData = {
  user: User;
  accessToken: string;
  refreshToken: string;
  trial?: Trial;
  organization?: Organization;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  data: AuthData;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  trial?: Trial;
  organization?: Organization;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

// Campos exatos que o backend espera no /api/auth/register
export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  surname: string;
  username?: string;
  organizationName?: string;
  organizationCity?: string;
  organizationAddress?: string;
  organizationContact?: string;
  organizationZipCode?: string;
  organizationId?: string;
  role?: string;
};

type MeResponse = {
  success: boolean;
  data?: {
    user?: User;
    trial?: Trial;
  };
  user?: User;
  trial?: Trial;
};

//  Helpers

async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as T | ApiErrorPayload;

  if (!response.ok) {
    const payload = data as ApiErrorPayload;
    const message =
      Array.isArray(payload.errors) && payload.errors.length > 0
        ? payload.errors.map((e) => e.msg).join(" ")
        : (payload.message ?? "Unexpected server error.");
    throw new ApiRequestError(message, response.status, payload.error, payload.trial_ended_at);
  }

  return data as T;
}

async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = (await response.json().catch(() => ({}))) as T | ApiErrorPayload;

  if (!response.ok) {
    const payload = data as ApiErrorPayload;
    const message = payload.message ?? "Unexpected server error.";
    throw new ApiRequestError(message, response.status, payload.error, payload.trial_ended_at);
  }

  return data as T;
}

function normalizeAuthResponse(response: AuthResponse): AuthResponse {
  if (response.data?.user && response.data?.accessToken && response.data?.refreshToken) {
    return response;
  }

  if (response.user && response.accessToken && response.refreshToken) {
    return {
      success: response.success,
      message: response.message,
      data: {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        trial: response.trial,
        organization: response.organization,
      },
      trial: response.trial,
      organization: response.organization,
    };
  }

  throw new Error("Unexpected server response format.");
}

function normalizeMeResponse(response: MeResponse): {
  success: boolean;
  data: { user: User; trial?: Trial };
} {
  const user = response.data?.user ?? response.user;
  const trial = response.data?.trial ?? response.trial;

  if (!user) {
    throw new Error("Unexpected server response format.");
  }

  return {
    success: response.success,
    data: { user, trial },
  };
}

//  Auth requests

/** POST /api/auth/login */
export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>("/api/auth/login", payload);
  return normalizeAuthResponse(response);
}

/** POST /api/auth/register */
export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const authBody = {
    email: payload.email,
    password: payload.password,
    username: payload.username,
    name: payload.name,
    surname: payload.surname,
    organizationId: payload.organizationId,
    organizationName: payload.organizationName,
    organizationCity: payload.organizationCity,
    organizationAddress: payload.organizationAddress,
    organizationContact: payload.organizationContact,
    organizationZipCode: payload.organizationZipCode,
    role: payload.role,
  };

  const response = await apiPost<AuthResponse>("/api/auth/register", authBody);
  return normalizeAuthResponse(response);
}

/** POST /api/auth/refresh — renova o accessToken */
export async function refreshTokenRequest(refreshToken: string): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>("/api/auth/refresh", {
    refreshToken,
  });
  return normalizeAuthResponse(response);
}

/** POST /api/auth/logout — invalida ambos os tokens */
export async function logoutRequest(accessToken: string, refreshToken: string): Promise<void> {
  await apiPost("/api/auth/logout", { refreshToken }, accessToken);
}

/** GET /api/organizations/:id — organization details */
export async function getOrganizationRequest(orgId: string, token: string): Promise<OrganizationDetail> {
  return apiGet<OrganizationDetail>(`/api/organizations/${orgId}`, token);
}

/** GET /api/auth/me — authenticated user profile */
export async function getMeRequest(
  accessToken: string,
): Promise<{ success: boolean; data: { user: User; trial?: Trial } }> {
  const response = await apiGet<MeResponse>("/api/auth/me", accessToken);
  return normalizeMeResponse(response);
}

/** POST /api/auth/forgot-password */
export async function forgotPasswordRequest(
  payload: ForgotPasswordPayload,
): Promise<{ success?: boolean; message?: string }> {
  return apiPost<{ success?: boolean; message?: string }>("/api/auth/forgot-password", payload);
}

/** POST /api/auth/reset-password */
export async function resetPasswordRequest(
  payload: ResetPasswordPayload,
): Promise<{ success?: boolean; message?: string }> {
  return apiPost<{ success?: boolean; message?: string }>("/api/auth/reset-password", payload);
}

/** Authenticated GET helper — wraps apiGet with a getAccessToken callback */
export async function apiGetAuth<T>(path: string, getAccessToken: () => string | null): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");
  return apiGet<T>(path, token);
}

/** Authenticated POST helper */
async function apiPostAuth<T>(path: string, body: unknown, getAccessToken: () => string | null): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");
  return apiPost<T>(path, body, token);
}

/** Authenticated PATCH helper */
async function apiPatchAuth<T>(path: string, body: unknown, getAccessToken: () => string | null): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as T | ApiErrorPayload;

  if (!response.ok) {
    const payload = data as ApiErrorPayload;
    const message = payload.message ?? "Unexpected server error.";
    throw new ApiRequestError(message, response.status, payload.error);
  }

  return data as T;
}

/** Authenticated DELETE helper */
async function apiDeleteAuth(path: string, getAccessToken: () => string | null): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok && response.status !== 204) {
    const data = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new ApiRequestError(data.message ?? "Delete failed.", response.status, data.error);
  }
}

/** GET /api/documents — fetch all (used for KPIs/charts) */
export async function getOrgDocumentsRequest(
  _orgId: string,
  getAccessToken: () => string | null,
): Promise<DocumentRecord[]> {
  const response = await apiGetAuth<{ data: DocumentRecord[]; pagination: unknown }>(
    `/api/documents?limit=1000`,
    getAccessToken,
  );
  return response.data;
}

/** GET /api/documents?page=X&limit=Y — paginated (used for the documents list) */
export async function getOrgDocumentsPaginatedRequest(
  page: number,
  limit: number,
  getAccessToken: () => string | null,
): Promise<{ data: DocumentRecord[]; pagination: DocPagination }> {
  return apiGetAuth<{ data: DocumentRecord[]; pagination: DocPagination }>(
    `/api/documents?page=${page}&limit=${limit}`,
    getAccessToken,
  );
}

/** GET /api/invites?organizationId=:id */
export async function getOrgInvitesRequest(
  orgId: string,
  getAccessToken: () => string | null,
): Promise<InviteRecord[]> {
  const response = await apiGetAuth<{ data: InviteRecord[]; pagination: unknown }>(
    `/api/invites?organizationId=${orgId}&limit=1000`,
    getAccessToken,
  );
  return response.data;
}

/** POST /api/invites — create new invite */
export type CreateInvitePayload = {
  email: string;
  role: string;
  organizationId: string;
};

export async function createInviteRequest(
  payload: CreateInvitePayload,
  getAccessToken: () => string | null,
): Promise<InviteRecord> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");
  return apiPost<InviteRecord>("/api/invites", payload, token);
}

export type InviteInfo = {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  expiresAt: string;
};

/** GET /api/auth/check-email — public, check if email already has an account */
export async function checkEmailRequest(email: string): Promise<boolean> {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`,
  );
  if (!response.ok) return false;
  const data = (await response.json().catch(() => ({}))) as { exists?: boolean };
  return data.exists === true;
}

/** GET /api/invites/by-token/:token — public, fetch invite info by token */
export async function getInviteByTokenRequest(token: string): Promise<InviteInfo> {
  const response = await fetch(`${API_BASE_URL}/api/invites/by-token/${token}`);
  const data = (await response.json().catch(() => ({}))) as InviteInfo | ApiErrorPayload;

  if (!response.ok) {
    const payload = data as ApiErrorPayload;
    throw new ApiRequestError(payload.message ?? "Invalid or expired invite.", response.status, payload.error);
  }

  return data as InviteInfo;
}

/** PATCH /api/invites/:id/accept — accept an invite (existing user) */
export async function acceptInviteByIdRequest(
  inviteId: string,
  token: string,
  userId: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/invites/${inviteId}/accept`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token, userId }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new ApiRequestError(data.message ?? "Failed to accept invite.", response.status, data.error);
  }
}

/** DELETE /api/invites/:id — revoke an invite */
export async function deleteInviteRequest(inviteId: string, getAccessToken: () => string | null): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE_URL}/api/invites/${inviteId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok && response.status !== 204) {
    const data = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    const message = data.message ?? "Failed to revoke invite.";
    throw new ApiRequestError(message, response.status, data.error);
  }
}

export type DepartmentMember = {
  id: string;
  departmentId: string;
  userId: string;
  createdAt?: string;
};

export type DepartmentWithMembers = Department & {
  members?: DepartmentMember[];
};

/** GET /api/organizations/:orgId/departments */
export async function getDepartmentsRequest(orgId: string, getAccessToken: () => string | null): Promise<DepartmentWithMembers[]> {
  return apiGetAuth<DepartmentWithMembers[]>(`/api/organizations/${orgId}/departments`, getAccessToken);
}

/** POST /api/organizations/:orgId/departments */
export async function createDepartmentRequest(
  orgId: string,
  data: { name: string; description?: string },
  getAccessToken: () => string | null,
): Promise<Department> {
  return apiPostAuth<Department>(`/api/organizations/${orgId}/departments`, data, getAccessToken);
}

/** PATCH /api/organizations/:orgId/departments/:deptId */
export async function updateDepartmentRequest(
  orgId: string,
  deptId: string,
  data: { name?: string; description?: string },
  getAccessToken: () => string | null,
): Promise<Department> {
  return apiPatchAuth<Department>(`/api/organizations/${orgId}/departments/${deptId}`, data, getAccessToken);
}

/** DELETE /api/organizations/:orgId/departments/:deptId */
export async function deleteDepartmentRequest(
  orgId: string,
  deptId: string,
  getAccessToken: () => string | null,
): Promise<void> {
  return apiDeleteAuth(`/api/organizations/${orgId}/departments/${deptId}`, getAccessToken);
}

/** GET /api/organizations/:orgId/departments/:deptId/members */
export async function getDepartmentMembersRequest(
  orgId: string,
  deptId: string,
  getAccessToken: () => string | null,
): Promise<DepartmentMember[]> {
  return apiGetAuth<DepartmentMember[]>(`/api/organizations/${orgId}/departments/${deptId}/members`, getAccessToken);
}

/** POST /api/organizations/:orgId/departments/:deptId/members */
export async function addDepartmentMemberRequest(
  orgId: string,
  deptId: string,
  userId: string,
  getAccessToken: () => string | null,
): Promise<DepartmentMember> {
  return apiPostAuth<DepartmentMember>(`/api/organizations/${orgId}/departments/${deptId}/members`, { userId }, getAccessToken);
}

/** DELETE /api/organizations/:orgId/departments/:deptId/members/:userId */
export async function removeDepartmentMemberRequest(
  orgId: string,
  deptId: string,
  userId: string,
  getAccessToken: () => string | null,
): Promise<void> {
  return apiDeleteAuth(`/api/organizations/${orgId}/departments/${deptId}/members/${userId}`, getAccessToken);
}

/** GET /api/organizations/:orgId/departments/by-user/:userId */
export async function getUserDepartmentsRequest(
  orgId: string,
  userId: string,
  getAccessToken: () => string | null,
): Promise<Department[]> {
  return apiGetAuth<Department[]>(`/api/organizations/${orgId}/departments/by-user/${userId}`, getAccessToken);
}

export type OrgMember = {
  id: string;
  email: string;
  name: string;
  surname: string;
  username?: string;
  role: string;
  status?: string;
  organization_id?: string;
  createdAt?: string;
};

/** GET /api/auth/users — staff sees all users, admin sees only their org */
export async function getOrgMembersRequest(
  getAccessToken: () => string | null,
): Promise<OrgMember[]> {
  return apiGetAuth<OrgMember[]>(`/api/auth/users`, getAccessToken);
}

export type MemberPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** GET /api/auth/users?page=&limit=&search= — paginated variant */
export async function getOrgMembersPaginatedRequest(
  page: number,
  limit: number,
  search: string,
  getAccessToken: () => string | null,
): Promise<{ data: OrgMember[]; pagination: MemberPagination }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return apiGetAuth<{ data: OrgMember[]; pagination: MemberPagination }>(
    `/api/auth/users?${params}`,
    getAccessToken,
  );
}

/** PATCH /api/auth/users/:id/role — staff only */
export async function updateUserRoleRequest(
  userId: string,
  role: string,
  getAccessToken: () => string | null,
): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");
  const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new ApiRequestError(data.message ?? "Failed to update role.", response.status, data.error);
  }
}

export type SystemHealth = {
  status: string;
  uptime: number;
  environment: string;
  memory: { rss: number; heapTotal: number; heapUsed: number; external: number };
  timestamp: string;
};

/** GET /api/auth/admin/health — staff/admin only */
export async function getAdminHealthRequest(
  getAccessToken: () => string | null,
): Promise<SystemHealth> {
  const res = await apiGetAuth<{ success: boolean; data: SystemHealth }>("/api/auth/admin/health", getAccessToken);
  return (res as unknown as { data: SystemHealth }).data ?? (res as unknown as SystemHealth);
}

// ─── Organizations (staff) ────────────────────────────────────────────────────

export type OrganizationSummary = {
  id: string;
  name: string;
  email?: string;
  city?: string;
  address?: string;
  contact?: number;
  zipCode?: string;
  status: string;
  plan?: string;
  createdAt?: string;
  memberCount?: number;
};

/** GET /api/organizations — staff sees all, admin sees own */
export async function getAllOrganizationsRequest(
  getAccessToken: () => string | null,
): Promise<OrganizationSummary[]> {
  return apiGetAuth<OrganizationSummary[]>("/api/organizations", getAccessToken);
}

/** PATCH /api/organizations/:id — update org (e.g. status: suspended | active) */
export async function updateOrganizationRequest(
  orgId: string,
  data: { status?: string; name?: string; email?: string },
  getAccessToken: () => string | null,
): Promise<OrganizationDetail> {
  return apiPatchAuth<OrganizationDetail>(`/api/organizations/${orgId}`, data, getAccessToken);
}

// ─── Memberships ──────────────────────────────────────────────────────────────

export type Membership = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  status?: string;
  createdAt?: string;
  user?: {
    id: string;
    name: string;
    surname: string;
    email: string;
    username?: string;
  };
};

/** GET /api/memberships?organizationId=:id */
export async function getMembershipsRequest(
  orgId: string,
  getAccessToken: () => string | null,
): Promise<Membership[]> {
  const response = await apiGetAuth<{ data: Membership[]; pagination: unknown }>(
    `/api/memberships?organizationId=${orgId}&limit=1000`,
    getAccessToken,
  );
  return response.data;
}

/** PATCH /api/memberships/:id — update a member's role */
export async function updateMembershipRequest(
  membershipId: string,
  data: { role: string },
  getAccessToken: () => string | null,
): Promise<Membership> {
  return apiPatchAuth<Membership>(`/api/memberships/${membershipId}`, data, getAccessToken);
}

/** DELETE /api/memberships/:id — remove member from the organization */
export async function deleteMembershipRequest(
  membershipId: string,
  getAccessToken: () => string | null,
): Promise<void> {
  return apiDeleteAuth(`/api/memberships/${membershipId}`, getAccessToken);
}

/**
 * Resend an invite: deletes the existing invite and creates a new one
 * with the same email, role and organizationId.
 */
export async function resendInviteRequest(
  invite: Pick<InviteRecord, "id" | "email" | "role" | "organizationId">,
  getAccessToken: () => string | null,
): Promise<InviteRecord> {
  await deleteInviteRequest(invite.id, getAccessToken);
  return createInviteRequest(
    {
      email: invite.email ?? "",
      role: invite.role ?? "member",
      organizationId: invite.organizationId ?? "",
    },
    getAccessToken,
  );
}