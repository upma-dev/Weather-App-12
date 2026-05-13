import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";
import { normalizeEmail } from "@/lib/normalize-email";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, otp } = await request.json();

    const emailNorm = normalizeEmail(email);
    if (!emailNorm) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate OTP
    if (!user.otp || user.otp !== otp || user.otpType !== "login") {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json({ error: "OTP expired. Please login again." }, { status: 400 });
    }

    // Clear OTP after use
    user.otp = null;
    user.otpExpiry = null;
    user.otpType = null;
    user.isVerified = true;
    await user.save();

    // Generate JWT
    const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name });

    const response = NextResponse.json(
      { message: "Login successful", user: { name: user.name, email: user.email } },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
