import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

export interface Invitation {
  email: string;
  name?: string;
  role: string;
  userId: string;
  managerId: string;
  expiry: Date;
  used: boolean;
}

export const INVITATION_EXPIRY_DAYS = 7;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function storeInvitation(
  token: string,
  data: Omit<Invitation, "expiry" | "used">
): Promise<void> {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + INVITATION_EXPIRY_DAYS);

  await prisma.invitationToken.create({
    data: {
      token,
      email: data.email,
      name: data.name,
      role: data.role,
      userId: data.userId,
      managerId: data.managerId,
      expiry,
    },
  });
}

export async function getInvitation(token: string): Promise<Invitation | null> {
  const invitation = await prisma.invitationToken.findUnique({
    where: { token },
  });

  if (!invitation) {
    return null;
  }

  return {
    email: invitation.email,
    name: invitation.name || undefined,
    role: invitation.role,
    userId: invitation.userId,
    managerId: invitation.managerId || "",
    expiry: invitation.expiry,
    used: invitation.used,
  };
}

export async function markInvitationAsUsed(token: string): Promise<void> {
  await prisma.invitationToken.update({
    where: { token },
    data: { used: true },
  });
}

export async function isTokenUsed(token: string): Promise<boolean> {
  const invitation = await prisma.invitationToken.findUnique({
    where: { token },
  });
  return invitation?.used === true;
}

export async function cleanupExpiredInvitations(): Promise<void> {
  const now = new Date();
  await prisma.invitationToken.deleteMany({
    where: {
      expiry: {
        lt: now,
      },
    },
  });
}

export async function sendInvitationEmail(
  email: string,
  token: string,
  role: string
): Promise<void> {
  const baseUrl =
    process.env.FRONTEND_URL ;
  const invitationLink = `${baseUrl}/register?token=${token}`;
  const roleText = role === "manager" ? "Manager" : "Employee";

  const htmlBody = `
    <h1>Team ${roleText} Invitation</h1>
    <p>You have been invited to join our team management system as a ${roleText.toLowerCase()}.</p>
    <p>Click the link below to complete your registration:</p>
    <p>
      <a href="${invitationLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
        Complete Registration
      </a>
    </p>
    <p>This invitation will expire in ${INVITATION_EXPIRY_DAYS} days.</p>
    <p>If you did not expect this invitation, please ignore this email.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_SENDER_EMAIL,
    to: email,
    subject: `Invitation to join as ${roleText}`,
    html: htmlBody,
  });
}
