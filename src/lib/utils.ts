import { clsx, type ClassValue } from "clsx";
import { ListTodo, Users } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Icons: any = {
  team: Users,
  task: ListTodo,
  logo: ListTodo,
};

export const getNavItems = (role?: string) => {
  if (role === "manager" || role === "Admin") {
    return [
      { title: "Tasks", url: "/task", icon: "task" },
      { title: "Team", url: "/team", icon: "team" },
    ];
  } else if (role === "employee") {
    return [{ title: "Tasks", url: "/task", icon: "task" }];
  }
  return [{ title: "Tasks", url: "/task", icon: "task" }];
};
