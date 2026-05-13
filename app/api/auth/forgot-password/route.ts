import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendOTPEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/normalize-email";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email } = await request.json();

    const emailNorm = normalizeEmail(email);
    if (!emailNorm) {
      return NextResponse.json({ message: "If this email exists, an OTP was sent." }, { status: 200 });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      // Security: don't reveal if email exists
      return NextResponse.json({ message: "If this email exists, an OTP was sent." }, { status: 200 });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpType = "reset";
    await user.save();

    await sendOTPEmail(emailNorm, otp, "reset");

    return NextResponse.json({ message: "Password reset OTP sent to your email." }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
