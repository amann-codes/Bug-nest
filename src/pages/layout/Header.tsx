"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import React from "react";

export default function Header() {
  const session = useSession();
  const [userData, setUserData] = React.useState<any>(null);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setUserData(session?.data?.user);
    }
  }, [session?.data?.user]);

  return (
    <header className="flex h-full items-center justify-between border-b px-4 bg-background">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">BugNest</h1>
      </div>
      <div className="flex items-center gap-2">
        {userData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-9 w-9 rounded-full bg-blue-400 text-white">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userData?.image || ""} alt="User avatar" />
                  <AvatarFallback>
                    {userData?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-mono">
                  <p className="font-medium">{userData?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userData?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-mono text-xs cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/signin" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
