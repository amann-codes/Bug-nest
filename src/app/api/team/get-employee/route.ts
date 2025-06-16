import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { getSession } from "@/lib/actions/get-user-id";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
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
    console.log("employees", employees);
    if(!employees){
      return NextResponse.json({
        message: "Employees retrieved successfully",
        status: "success",
        employees: [],
      });
    }
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
