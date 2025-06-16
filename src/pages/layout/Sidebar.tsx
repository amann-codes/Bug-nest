"use client";

import React from "react";
import { Bug, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@radix-ui/react-collapsible";
import { getNavItems, Icons } from "@/lib/utils";

export default function SidebarNav() {
  const pathname = usePathname();
  const [navItems, setNavItems] = React.useState(getNavItems());
  const [isMounted, setIsMounted] = React.useState(false);

  const session = useSession();

  React.useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      setNavItems(getNavItems(session?.data?.user?.role));
    }
  }, [session?.data?.user?.role]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="md:flex h-full border-r bg-background overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          {navItems.map((item: any) => {
            const Icon = item.icon ? Icons[item.icon] : Icons.logo;
            return item?.items && item?.items?.length > 0 ? (
              <Collapsible
                key={item.title}
                defaultOpen={item.isActive}
                className="space-y-1"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  <div className="flex items-center gap-2">
                    {item.icon && <Icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pt-1 pb-1">
                  <div className="space-y-1">
                    {item.items?.map((subItem: any) => (
                      <Link
                        key={subItem.title}
                        href={subItem.url}
                        className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${pathname === subItem.url ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                      >
                        <span>{subItem.title}</span>
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link
                key={item.title}
                href={item.url}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${pathname === item.url ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
              >
                {item.icon && <Icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
