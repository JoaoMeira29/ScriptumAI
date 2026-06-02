export interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: 'admin' | 'user' | 'staff';
  displayName: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}
