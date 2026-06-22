import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { users, barbers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

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

        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
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
