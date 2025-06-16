"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems, Icons } from "@/lib/utils";
import { useSession } from "next-auth/react";

export function MobileTabs() {
  const pathname = usePathname();
  const [navItems, setNavItems] = React.useState(getNavItems());
  const session = useSession();
  
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setNavItems(getNavItems(session?.data?.user?.role));
    }
  }, [session?.data?.user?.role]);

  // Only show top-level nav items in mobile tabs
  const topLevelItems = navItems.filter((item: any) => !item.parent);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="grid grid-cols-3 h-16">
        {topLevelItems.map((item: any) => {
          const Icon = item.icon ? Icons[item.icon] : Icons.logo;
          const isActive = pathname === item.url;
          
          return (
            <Link 
              key={item.title} 
              href={item.url}
              className={`flex flex-col items-center justify-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
