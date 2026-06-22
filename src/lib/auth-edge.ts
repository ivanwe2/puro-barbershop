import NextAuth from "next-auth";

export const { auth } = NextAuth({
  providers: [],
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
});
