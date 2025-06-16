import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Username",
          type: "text",
          placeholder: "username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          console.log("User not found: Missing credentials");
          return null;
        }
        const existingUser = await prisma.user.findFirst({
          where: {
            email: credentials.email,
          },
          select: {
            email: true,
            password: true,
            id: true,
            name: true,
            role: true,
          },
        });
        console.log("existing user", existingUser)
        if (!existingUser) {
          const user = await prisma.employee.findFirst({
            where: {
              email: credentials.email,
            },
            select: {
              email: true,
              password: true,
              id: true,
              name: true,
              role: true,
            },
          });
          console.log("user", user)
          if (!user) {
            console.log("User not found: Invalid credentials");
            return null;
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }
        if (
          existingUser &&
          existingUser.password &&
          (await bcrypt.compare(credentials.password, existingUser.password))
        ) {
          console.log("User found with correct credentials");
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
          };
        }
        console.log("User not found or incorrect credentials");
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
};
