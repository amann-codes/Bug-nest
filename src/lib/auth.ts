import NextAuth from "next-auth";
import { authOptions } from "./auth.config";

export const {
  handler: { GET, POST },
  auth,
} = NextAuth({
  session: { strategy: "jwt" },
  ...authOptions,
});