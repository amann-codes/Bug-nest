import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }
}
export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum MediaType {
  IMAGE = "image",
  AUDIO = "audio",
}

export interface Media {
  id: string;
  type: MediaType;
  url: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: Date;
  dueDate?: Date;
  endDate?: Date;
  assigneeId?: string;
  assignedEmployeeIds?: string[];
  assignerId?: string;
  managerId?: string;
  companyId?: string;
  message?: string;
  media?: Media[];
  manager?: Employee;
  assignedEmployees?: Employee[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "manager" | "employee";
  companyId: string;
  managerIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
}
