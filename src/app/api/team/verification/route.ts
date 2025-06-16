import { NextResponse } from "next/server";
import {
  getInvitation,
  isTokenUsed,
  cleanupExpiredInvitations,
} from "@/lib/team.utils";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { status: "error", message: "Token is required" },
        { status: 400 }
      );
    }

    
    cleanupExpiredInvitations();

    
    if (await isTokenUsed(token)) {
      console.error("Token is already used:", token);
      return NextResponse.json(
        { status: "error", message: "This invitation has already been used" },
        { status: 400 }
      );
    }

    
    const invitation =await getInvitation(token);
    console.log("Invitation found:", JSON.stringify(invitation, null, 2));
    
    if (!invitation) {
      console.error("No invitation found for token:", token);
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid invitation token. Please request a new invitation.",
        },
        { status: 400 }
      );
    }

    
    const currentTime = new Date();
    console.log("Current time:", currentTime);
    console.log("Invitation expiry:", invitation.expiry);
    
    if (invitation.expiry < currentTime) {
      console.error("Invitation has expired. Token:", token);
      return NextResponse.json(
        {
          status: "error",
          message: "This invitation has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        userId: invitation.userId,
        expiry: invitation.expiry,
      },
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
