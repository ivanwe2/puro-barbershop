import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: "super_admin" | "barber";
      barberId?: number;
    };
  }

  interface User {
    role: "super_admin" | "barber";
    barberId?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string | null;
    email: string | null;
    role: "super_admin" | "barber";
    barberId?: number;
  }
}
