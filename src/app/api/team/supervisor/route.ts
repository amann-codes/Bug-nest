import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import {
  storeInvitation,
  generateToken,
  sendInvitationEmail,
} from "@/lib/team.utils";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { message: "Request body is empty", status: "error" },
        { status: 400 }
      );
    }

    const { email, userId, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Invalid email", status: "error" },
        { status: 400 }
      );
    }
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { message: "Invalid client ID", status: "error" },
        { status: 400 }
      );
    }
    if (name && typeof name !== "string") {
      return NextResponse.json(
        { message: "Invalid name", status: "error" },
        { status: 400 }
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
    await storeInvitation(token, {
      email,
      name,
      role: "supervisor",
      userId, // Using clientId as userId for supervisor
      managerId: "", // Supervisor has no manager
    });

    await sendInvitationEmail(email, token, "supervisor");
    return NextResponse.json({
      message: "Supervisor invitation created successfully",
      status: "success",
      invitationToken: token,
    });
  } catch (error) {
    console.error("Error creating supervisor invitation:", error);
    return NextResponse.json(
      { message: "Internal server error", status: "error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}