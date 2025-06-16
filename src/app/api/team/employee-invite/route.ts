import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { getSession } from "@/lib/actions/get-user-id";
import {
  generateToken,
  INVITATION_EXPIRY_DAYS,
  sendInvitationEmail,
  storeInvitation,
  getInvitation,
  isTokenUsed,
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

    const sessionId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== "manager" && userRole !== "Admin") {
      return NextResponse.json(
        {
          message: "Only managers and admins can invite employees",
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

    const { email, name } = body;

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

    const employee = await prisma.employee.findUnique({
      where: {
        id: sessionId,
      },
    });
    if (!employee) {
      return NextResponse.json(
        {
          message: "Manager not found",
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
      role: "employee",
      userId: employee.id,
      managerId: sessionId,
    });

    await sendInvitationEmail(email, token, "employee");
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    if (await isTokenUsed(token)) {
      return NextResponse.json(
        { success: false, error: "This invitation has already been used." },
        { status: 400 }
      );
    }

    const invitation = await getInvitation(token);

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired invitation token" },
        { status: 404 }
      );
    }

    if (new Date() > new Date(invitation.expiry)) {
      return NextResponse.json(
        { success: false, error: "This invitation has expired." },
        { status: 410 }
      );
    }

    return NextResponse.json({ success: true, data: invitation });
  } catch (error) {
    console.error("Error fetching invitation details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
