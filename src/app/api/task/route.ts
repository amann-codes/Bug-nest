import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { getSession } from "@/lib/actions/get-user-id";
import { z } from "zod";

const prisma = new PrismaClient();

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

type UserRole = "Admin" | "Manager" | "Employee";

interface SessionUser {
  id: string;
  role: UserRole;
  email: string;
  name?: string;
}

const createTaskSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  endDate: z.string().datetime().optional(),
  assignedEmployeeIds: z
    .array(z.string().cuid())
    .min(1, "At least one employee must be assigned"),
});

const updateTaskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "title is required").optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  endDate: z.string().datetime().optional().nullable(),
  assignedEmployeeIds: z.array(z.string().cuid()).optional(),
});

async function canManageTasks(
  userId: string,
  role: UserRole,
  assignedEmployeeIds?: string[]
): Promise<boolean> {
  if (role === "Admin") return true;

  if (role === "Manager" && assignedEmployeeIds) {
  
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: assignedEmployeeIds },
        userId,
      },
      select: { id: true },
    });

    return employees.length === assignedEmployeeIds.length;
  }

  return role === "Manager";
}

async function canViewTask(
  userId: string,
  role: UserRole,
  task: { creatorId: string; assignedEmployeeIds: string[] }
): Promise<boolean> {
  if (role === "Admin") return true;
  if (task.creatorId === userId) return true;
  if (task.assignedEmployeeIds.includes(userId)) return true;

  if (role === "Manager") {
  
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: task.assignedEmployeeIds },
        userId,
      },
      select: { id: true },
    });

    return employees.length > 0;
  }

  return false;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const user = session.user as SessionUser;
    const { id: userId, role } = user;

    let whereClause: any = {};

    if (role === "Employee") {
    
      whereClause = {
        OR: [{ creatorId: userId }, { assignedEmployeeIds: { has: userId } }],
      };
    } else if (role === "Manager") {
    
      const teamMembers = await prisma.employee.findMany({
        where: { userId: userId },
        select: { id: true },
      });

      const teamMemberIds = teamMembers.map((member) => member.id);

      whereClause = {
        OR: [
          { creatorId: userId },
          { assignedEmployeeIds: { hasSome: teamMemberIds } },
        ],
      };
    }
  

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedEmployeeIds: true,
        managerId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("tasks", tasks);
    console.log("role", role);
    console.log("userId", userId);
    return NextResponse.json({
      message: "Tasks retrieved successfully",
      status: "success",
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { message: "Internal server error", status: "error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const user = session.user as SessionUser;
    const { id: userId, role } = user;

  
    if (role === "Employee") {
      return NextResponse.json(
        {
          message: "You don't have permission to create tasks",
          status: "error",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { message: "Request body is empty", status: "error" },
        { status: 400 }
      );
    }
    console.log("body", body);
  
    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: validation.error.errors,
          status: "error",
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      status,
      priority,
      endDate: dueDate,
      assignedEmployeeIds,
    } = validation.data;

  
    const manager = await prisma.employee.findFirst({
      where: { userId: userId },
    });

    if (!manager) {
      return NextResponse.json(
        {
          message: "Manager profile not found for the current user.",
          status: "error",
        },
        { status: 404 }
      );
    }

    if (!(await canManageTasks(userId, role, assignedEmployeeIds))) {
      return NextResponse.json(
        {
          message:
            "You don't have permission to assign tasks to one or more selected employees",
          status: "error",
        },
        { status: 403 }
      );
    }

  
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: assignedEmployeeIds },
      },
      select: { id: true },
    });

    if (employees.length !== assignedEmployeeIds.length) {
      return NextResponse.json(
        {
          message: "One or more assigned employees not found",
          status: "error",
        },
        { status: 404 }
      );
    }

  
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        dueDate: dueDate ? new Date(dueDate) : null,
        managerId: manager.id,
        assignedEmployeeIds: assignedEmployeeIds || [],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedEmployeeIds: true,
      },
    });

    return NextResponse.json(
      {
        message: "Task created successfully",
        data: task,
        status: "success",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { message: "Internal server error", status: "error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const user = session.user as SessionUser;
    const { id: userId, role } = user;

    const body = await request.json();
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { message: "Request body is empty", status: "error" },
        { status: 400 }
      );
    }

  
    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: validation.error.errors,
          status: "error",
        },
        { status: 400 }
      );
    }

    const {
      id,
      title,
      description,
      status,
      priority,
      endDate: dueDate,
      assignedEmployeeIds,
    } = validation.data;

  
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { message: "Task not found", status: "error" },
        { status: 404 }
      );
    }

  
    const taskWithCreatorId = {
      creatorId: task.managerId,
      assignedEmployeeIds: task.assignedEmployeeIds,
    };
    const canUpdate = await canViewTask(userId, role, taskWithCreatorId);
    if (!canUpdate) {
      return NextResponse.json(
        {
          message: "You don't have permission to update this task",
          status: "error",
        },
        { status: 403 }
      );
    }

  
    if (role === "Employee") {
      const { id: taskId, status: newStatus } = validation.data;
      const updateData: { status?: TaskStatus } = {};
      if (newStatus) {
        updateData.status = newStatus as TaskStatus;
      } else {
      
      
      
      
      
      
        const allowedKeys = ['id', 'status'];
        const receivedKeys = Object.keys(validation.data);
      
        const invalidKeys = receivedKeys.filter(key => 
            !allowedKeys.includes(key) && 
            validation.data[key as keyof typeof validation.data] !== undefined
        );

        if (invalidKeys.length > 0) {
            return NextResponse.json(
              {
                message: `Employees can only update the task status. Invalid fields: ${invalidKeys.join(', ')}`,
                status: "error",
              },
              { status: 403 }
            );
        }
      }

      const employeeUpdateData = {
        status: newStatus as TaskStatus | undefined,
      };

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: employeeUpdateData,
        select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assignedEmployeeIds: true,
          },
      });
       return NextResponse.json(
        {
          message: "Task status updated successfully by employee",
          data: updatedTask,
          status: "success",
        },
        { status: 200 }
      );
    }

  
    if (assignedEmployeeIds && assignedEmployeeIds.length > 0) {
      const canAssign = await canManageTasks(userId, role, assignedEmployeeIds);
      if (!canAssign) {
        return NextResponse.json(
          {
            message:
              "You don't have permission to assign tasks to one or more selected employees",
            status: "error",
          },
          { status: 403 }
        );
      }
    }

  
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status: status as TaskStatus | undefined,
        priority: priority as TaskPriority | undefined,
        dueDate: dueDate
          ? new Date(dueDate)
          : dueDate === null
          ? null
          : undefined,
        assignedEmployeeIds,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedEmployeeIds: true,
      },
    });

    return NextResponse.json(
      {
        message: "Task updated successfully",
        data: updatedTask,
        status: "success",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { message: "Internal server error", status: "error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const user = session.user as SessionUser;
    const { id: userId, role } = user;

  
    if (role === "Employee") {
      return NextResponse.json(
        {
          message: "Employees do not have permission to delete tasks.",
          status: "error",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Task ID is required", status: "error" },
        { status: 400 }
      );
    }

  
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { message: "Task not found", status: "error" },
        { status: 404 }
      );
    }

  
    if (task.managerId !== userId && role !== "Admin") {
      return NextResponse.json(
        {
          message: "Only task creator or admin can delete tasks",
          status: "error",
        },
        { status: 403 }
      );
    }

  
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Task deleted successfully",
      status: "success",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { message: "Internal server error", status: "error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
