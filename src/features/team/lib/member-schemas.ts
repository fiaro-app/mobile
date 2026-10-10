import { z } from 'zod';
import { RoleSchema } from '@/features/workspace/lib/roles';

/** Una membresía con el nombre y el celular de la persona, como la devuelve `QUERY /memberships`. */
export const MemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  phone: z.string(),
  roles: z.array(RoleSchema),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  portfolioId: z.string().nullable(),
});
export type Member = z.infer<typeof MemberSchema>;

/** Página de membresías. */
export const MembersPageSchema = z.object({ data: z.array(MemberSchema), meta: z.object({ total: z.number() }) });
