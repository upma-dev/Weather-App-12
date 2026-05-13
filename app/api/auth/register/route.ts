import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { normalizeEmail } from "@/lib/normalize-email";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { name, email, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const emailNorm = normalizeEmail(email);
    if (!emailNorm) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const existing = await User.findOne({ email: emailNorm });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = await User.create({ name, email: emailNorm, password });

    return NextResponse.json(
      { message: "Account created successfully", userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
