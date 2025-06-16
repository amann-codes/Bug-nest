import { PrismaClient } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import zod from "zod";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
export async function POST(req: Request) {
  try {
    const userSchema = zod.object({
      name: zod.string(),
      email: zod.string().email(),
      password: zod.string().min(6),
    });
    const body = await req.json();
    const { name, email, password } = userSchema.parse(body);
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existingUser) {
      return NextResponse.json(
        {
          status: "error",
          message: "User already exists with this email",
        },
        { status: 409 }
      );
    }
    const passhash = await bcrypt.hash(password, 10);
    const result = await prisma.user.create({
      data: {
        name,
        email,
        password: passhash,
      },
    });
    
    return NextResponse.json({
      status: "success",
      message: "User created successfully",
      data: {
        userId: result.id
      }
    });
  } catch (e) {
    console.error("Error during signup:", e);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create user",
      },
      { status: 500 }
    );
  }
}
