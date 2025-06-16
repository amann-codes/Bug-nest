import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { getSession } from "@/lib/actions/get-user-id";
import {
  generateToken,
  INVITATION_EXPIRY_DAYS,
  sendInvitationEmail,
  storeInvitation,
} from "@/lib/team.utils";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const id = session.user.id;
    console.log("id", id);
    const userRole = session.user.role;

    if (userRole !== "manager" && userRole !== "Admin") {
      return NextResponse.json(
        {
          message: "Only managers can access this endpoint",
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

    const { email, name, role = "employee" } = body;

    let userId;
    let managerId;

    if (userRole === "Admin") {
      userId = id;
      managerId = id;
    } else if (userRole === "manager") {
      const user = await prisma.employee.findUnique({
        where: {
          id,
        },
        select: {
          userId: true,
        },
      });
      if (!user) {
        throw new Error("user not found for the manager");
      }
      userId = user.userId;
      managerId = id;
    } else {
      return NextResponse.json(
        {
          message: "User role not authorized to send invitations.",
          status: "error",
        },
        { status: 403 }
      );
    }

    if (!managerId) {
      return NextResponse.json(
        { message: "manager id not found", status: "error" },
        { status: 403 }
      );
    }
    if (userRole === "manager" && role !== "employee") {
      return NextResponse.json(
        { message: "Managers can only add employees", status: "error" },
        { status: 403 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Invalid email", status: "error" },
        { status: 400 }
      );
    }
    if (name && typeof name !== "string") {
      return NextResponse.json(
        { message: "Invalid name", status: "error" },
        { status: 400 }
      );
    }

    if (userRole !== "manager" && userRole !== "Admin") {
      return NextResponse.json(
        {
          message: "Only managers and admin can create employee invitations",
          status: "error",
        },
        { status: 403 }
      );
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });
    if (existingEmployee) {
      return NextResponse.json(
        {
          message: "Employee with this email already exists",
          status: "error",
        },
        { status: 400 }
      );
    }

    const token = generateToken();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + INVITATION_EXPIRY_DAYS);

    await storeInvitation(token, {
      email,
      name: name || "",
      role: role,
      userId,
      managerId,
    });

    await sendInvitationEmail(email, token, role);
    return NextResponse.json({
      message: "Employee invitation created successfully",
      status: "success",
      invitationToken: token,
    });
  } catch (error) {
    console.error("Error creating employee invitation:", error);
    return NextResponse.json(
      { message: "Internal server error", status: "error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    const session = await getSession();
    console.log("session at get session at get employyes", session);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    if (userRole !== "manager" && userRole !== "Admin") {
      return NextResponse.json(
        {
          message: "Only managers can view their employees",
          status: "error",
        },
        { status: 403 }
      );
    }

    const employees = await prisma.employee.findMany({
      where: {
        managerId: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userId: true,
      },
    });

    return NextResponse.json({
      message: "Employees retrieved successfully",
      status: "success",
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { message: "Internal server error", status: "error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
