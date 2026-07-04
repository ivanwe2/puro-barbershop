import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { users, barbers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

// A valid bcrypt hash (cost 12) of a random string. Compared against when the
// email is unknown or the account is locked, so authorize() spends similar
// time in every path and can't be used to enumerate valid admin emails.
const DUMMY_PASSWORD_HASH = "$2b$12$6VfTIr1BrsBlwheaVUyeIezd6MkZ6apVgPHlLGM6QvmJUNHxd2psu";
// Lock an account after this many consecutive failures, for this long.
const MAX_FAILED_ATTEMPTS = 8;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        const now = new Date();
        const locked = user?.lockedUntil != null && user.lockedUntil > now;

        // Always run a bcrypt comparison — against a dummy hash when the user
        // is missing or locked — so timing is uniform across all paths.
        const hashToCheck = !user || locked ? DUMMY_PASSWORD_HASH : user.passwordHash;
        const valid = await bcrypt.compare(password, hashToCheck);

        if (!user || locked || !valid) {
          // Record the failure and lock the account past the threshold. Only
          // meaningful when the account exists and isn't already locked.
          if (user && !locked) {
            const attempts = user.failedLoginAttempts + 1;
            const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
            await db
              .update(users)
              .set({
                failedLoginAttempts: shouldLock ? 0 : attempts,
                lockedUntil: shouldLock
                  ? new Date(now.getTime() + LOCK_DURATION_MS)
                  : user.lockedUntil,
                updatedAt: now,
              })
              .where(eq(users.id, user.id));
          }
          return null;
        }

        // Successful login — clear any accumulated failure state.
        if (user.failedLoginAttempts !== 0 || user.lockedUntil != null) {
          await db
            .update(users)
            .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: now })
            .where(eq(users.id, user.id));
        }

        const [barber] = await db
          .select({ id: barbers.id })
          .from(barbers)
          .where(eq(barbers.userId, user.id))
          .limit(1);

        const result: {
          id: string;
          email: string;
          name: string;
          role: "super_admin" | "barber";
          barberId?: number;
        } = {
          id: String(user.id),
          email: user.email,
          name: user.email.split("@")[0] ?? "",
          role: user.role,
        };
        if (barber?.id !== undefined) {
          result.barberId = barber.id;
        }
        return result;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? null;
        token.email = user.email ?? null;
        const typedUser = user as { role: "super_admin" | "barber"; barberId?: number };
        token.role = typedUser.role;
        token.barberId = typedUser.barberId;
      }
      return token;
    },
    async session({ session, token }) {
      const userObj: {
        id: string;
        email: string;
        role: "super_admin" | "barber";
        barberId?: number;
      } = {
        id: token.id as string,
        email: token.email as string,
        role: token.role as "super_admin" | "barber",
      };
      if (token.barberId !== undefined) {
        userObj.barberId = token.barberId as number;
      }
      session.user = {
        ...session.user,
        ...userObj,
      };
      return session;
    },
  },
  pages: {
    signIn: "/bg/admin/login",
  },
});
