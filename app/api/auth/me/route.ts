import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(authUser.userId).select("-password -otp -otpExpiry");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const authUser = getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { savedCities } = await request.json();

  const user = await User.findByIdAndUpdate(
    authUser.userId,
    { savedCities },
    { new: true }
  ).select("-password -otp -otpExpiry");

  return NextResponse.json({ user }, { status: 200 });
}
