import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  otp: string | null;
  otpExpiry: Date | null;
  otpType: "login" | "reset" | null;
  isVerified: boolean;
  savedCities: string[];
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    otpType: { type: String, enum: ["login", "reset", null], default: null },
    isVerified: { type: Boolean, default: false },
    savedCities: { type: [String], default: ["London", "New York", "Tokyo"] },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

const MODEL_NAME = "User";

// Next.js dev HMR can leave a stale compiled model; instance methods then misbehave.
if (process.env.NODE_ENV === "development" && mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export default (mongoose.models[MODEL_NAME] as mongoose.Model<IUser>) ??
  mongoose.model<IUser>(MODEL_NAME, UserSchema);
