"use client";
import { useSession } from "next-auth/react";

export default function Home() {
  const session = useSession();
  const data = JSON.stringify(session);
  console.log(session.data?.user?.name);
  return <p>{data}</p>;
}
