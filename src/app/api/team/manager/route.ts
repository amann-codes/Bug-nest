import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { getSession } from "@/lib/actions/get-user-id";
import {
  storeInvitation,
  generateToken,
  INVITATION_EXPIRY_DAYS,
  sendInvitationEmail,
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

    const userId = session.user.id;
    const userRole = session.user.role;

    
    if (userRole !== "Admin") {
      return NextResponse.json(
        {
          message: "Only administrators can invite managers",
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

    const { email, clientId, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Invalid email", status: "error" },
        { status: 400 }
      );
    }
    if (!clientId || typeof clientId !== "string") {
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
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + INVITATION_EXPIRY_DAYS);
    
    storeInvitation(token, {
      email,
      name: name || "",
      role: "manager",
      userId,
      managerId: userId, 
    });

    await sendInvitationEmail(email, token, "manager");
    return NextResponse.json({
      message: "Manager invitation created successfully",
      status: "success",
      invitationToken: token,
    });
  } catch (error) {
    console.error("Error creating manager invitation:", error);
    return NextResponse.json(
      { message: "Internal server error", status: "error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
