import 'server-only';
import { createHash } from 'node:crypto';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare, hashSync } from 'bcryptjs';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from './db';
const loginInput = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(1)
    .max(72)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
});
const dummyHash = hashSync('non-account-timing-comparison-only', 12);
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/admin/login', error: '/admin/login' },
  providers: [
    Credentials({
      name: 'Fullers administrator',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginInput.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const key = createHash('sha256').update(email).digest('hex');
        try {
          // Atomic, shared PostgreSQL throttle: at most five attempts per 15-minute account window.
          const rows = await db.$queryRaw<{ attempts: number }[]>`
          INSERT INTO "LoginThrottle" ("key", "attempts", "windowStart") VALUES (${key}, 1, NOW())
          ON CONFLICT ("key") DO UPDATE SET
          "attempts" = CASE WHEN "LoginThrottle"."windowStart" < NOW() - INTERVAL '15 minutes' THEN 1 ELSE LEAST("LoginThrottle"."attempts" + 1, 6) END,
          "windowStart" = CASE WHEN "LoginThrottle"."windowStart" < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE "LoginThrottle"."windowStart" END
          RETURNING "attempts"`;
          if (!rows[0] || rows[0].attempts > 5) {
            await compare(password, dummyHash);
            return null;
          }
          const user = await db.user.findUnique({ where: { email } });
          const valid = await compare(password, user?.passwordHash ?? dummyHash);
          if (!user?.active || !valid) return null;
          return { id: user.id, name: user.name, email: user.email };
        } catch {
          // No database, no login. Never expose Prisma errors or credential existence.
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub ?? '';
      return session;
    },
  },
};
export async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return user?.active ? user : null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error('Administrator access required.');
  return user;
}
