import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { normalizeEmail } from "@/lib/normalize-email";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, otp, newPassword } = await request.json();

    const emailNorm = normalizeEmail(email);
    if (!emailNorm || !otp || !newPassword) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.otp || user.otp !== otp || user.otpType !== "reset") {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    user.otpType = null;
    await user.save();

    return NextResponse.json({ message: "Password reset successfully. You can now login." }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
