import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import {
  getInvitation,
  markInvitationAsUsed,
  isTokenUsed,
  cleanupExpiredInvitations,
} from "@/lib/team.utils";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Request body is empty" },
        { status: 400 }
      );
    }

    const { token, name, email, password } = body;

    if (!token) {
      console.error("No token provided in registration request");
      return NextResponse.json(
        { success: false, error: "Invitation token is required" },
        { status: 400 }
      );
    }

    await cleanupExpiredInvitations();

    if (await isTokenUsed(token)) {
      console.error("Attempted to use already used token:", token);
      return NextResponse.json(
        { success: false, error: "This invitation has already been used" },
        { status: 400 }
      );
    }

    const invitation = await getInvitation(token);

    if (!invitation) {
      console.error(
        "No invitation found for token during registration:",
        token
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid invitation token. Please request a new invitation.",
        },
        { status: 400 }
      );
    }

    const currentTime = new Date();
    if (invitation.expiry < currentTime) {
      console.error("Attempted to register with expired token:", token);
      return NextResponse.json(
        {
          success: false,
          error: "This invitation has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    if (
      String(email).toLowerCase() !== String(invitation.email).toLowerCase()
    ) {
      return NextResponse.json(
        { success: false, error: "Email does not match the invitation" },
        { status: 400 }
      );
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { email: String(email).toLowerCase() },
    });
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: "An employee with this email already exists" },
        { status: 400 }
      );
    }

    let newEmployeeManagerIdValue: string;

    if (invitation.role === "employee" && invitation.managerId) {
      newEmployeeManagerIdValue = invitation.managerId;
    } else if (
      (invitation.role === "manager" || invitation.role === "employee") &&
      invitation.userId
    ) {
      newEmployeeManagerIdValue = invitation.userId;
    } else {
      console.error(
        "Critical: Could not determine managerId for new employee from invitation details:",
        JSON.stringify(invitation)
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Internal server error: Invalid invitation data for manager assignment.",
        },
        { status: 500 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await prisma.employee.create({
      data: {
        name,
        email: String(email).toLowerCase(),
        password: hashedPassword,
        role: invitation.role,
        managerId: newEmployeeManagerIdValue,
        userId: invitation.userId,
      },
    });

    await markInvitationAsUsed(token);

    const { password: _, ...employeeWithoutPassword } = newEmployee;
    return NextResponse.json({
      success: true,
      data: employeeWithoutPassword,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
