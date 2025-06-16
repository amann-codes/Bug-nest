"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";

interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  expires: string;
}

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session as Session;
}
