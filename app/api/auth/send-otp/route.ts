import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
    const { email, password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const emailNorm = normalizeEmail(email);
    if (!emailNorm) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const user = await User.findOne({ email: emailNorm });
    const devHint = process.env.NODE_ENV === "development";

    if (!user) {
      return NextResponse.json(
        {
          error: devHint
            ? `No account for ${emailNorm}. Sign up first or check MongoDB.`
            : "Invalid credentials",
        },
        { status: 401 }
      );
    }

    const hash = user.get("password");
    if (!hash || typeof hash !== "string") {
      return NextResponse.json(
        { error: devHint ? "User record has no password hash" : "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      return NextResponse.json(
        {
          error: devHint
            ? "Wrong password for this email (or typo). Try again or reset password."
            : "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpType = "login";
    await user.save();

    // Send OTP via email
    await sendOTPEmail(emailNorm, otp, "login");

    return NextResponse.json(
      { message: "OTP sent to your email", email: emailNorm },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
