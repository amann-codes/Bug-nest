import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { token, password, name } = await req.json();

    if (!token || !password || !name) {
      return NextResponse.json({ error: 'Token, name, and password are required' }, { status: 400 });
    }

    const invitationToken = await prisma.invitationToken.findUnique({
      where: { token },
    });

    if (!invitationToken || invitationToken.used) {
      return NextResponse.json({ error: 'Invalid or used token' }, { status: 400 });
    }

    if (new Date() > invitationToken.expiry) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    if(!invitationToken.managerId){
      throw new Error("manager id not found")
    }
    const newEmployee = await prisma.employee.create({
      data: {
        name,
        email: invitationToken.email,
        password: hashedPassword,
        role: invitationToken.role,
        userId: invitationToken.userId,
        managerId: invitationToken.managerId
      },
    });

    await prisma.invitationToken.update({
      where: { id: invitationToken.id },
      data: { used: true },
    });

    return NextResponse.json({ message: 'Registration successful', employee: newEmployee }, { status: 201 });

  } catch (error: any) {
    console.error('Registration Error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return NextResponse.json({ error: 'An employee with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
