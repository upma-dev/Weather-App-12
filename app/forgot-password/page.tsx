"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleSendOTP = async () => {
    if (!email) return toast.error("Enter your email");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("OTP sent if email exists!");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = () => {
    if (otp.join("").length !== 6) return toast.error("Enter complete OTP");
    setStep("password");
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return toast.error("Fill all fields");
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
    if (newPassword.length < 6) return toast.error("Password min 6 chars");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join(""), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Password reset! Please login.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Email", "Verify OTP", "New Password"];
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : 2;

  return (
    <div className="animated-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="orb w-96 h-96 bg-orange-600/15 -top-32 -right-32" />
      <div className="orb w-80 h-80 bg-indigo-500/15 bottom-0 left-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/login" className="inline-block">
            <h1 className="font-display text-2xl font-bold text-white">🌤 WeatherApp</h1>
          </Link>
        </div>

        <div className="glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  i < stepIndex ? "bg-teal-500 text-white" :
                  i === stepIndex ? "text-white" : "text-white/30"
                }`}
                  style={i === stepIndex ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)" } :
                    i < stepIndex ? {} : { background: "rgba(255,255,255,0.08)" }}>
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span className={`ml-2 text-xs font-medium hidden sm:block ${i === stepIndex ? "text-white" : "text-white/30"}`}>{s}</span>
                {i < 2 && <div className={`w-8 h-px mx-2 ${i < stepIndex ? "bg-teal-500" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>

          {step === "email" && (
            <>
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Enter your email and we'll send a 6-digit OTP
                </p>
              </div>
              <div className="space-y-4">
                <div className="input-with-icons">
                  <span className="input-with-icons__leading">
                    <Mail className="w-4 h-4 shrink-0" aria-hidden />
                  </span>
                  <input
                    type="email"
                    className="input-with-icons__field pr-4"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                    autoComplete="email"
                  />
                </div>
                <button onClick={handleSendOTP} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-white mb-2">Enter OTP</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Check <span className="text-indigo-400">{email}</span>
                </p>
              </div>
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((digit, i) => (
                  <input key={i} ref={(el) => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOTPChange(i, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                    className={`otp-input ${digit ? "filled" : ""}`}
                  />
                ))}
              </div>
              <button onClick={handleVerifyOTP} disabled={otp.join("").length !== 6} className="btn-primary w-full flex items-center justify-center gap-2 mb-4 disabled:opacity-50">
                Verify OTP <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => setStep("email")} className="w-full text-sm text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                ← Back
              </button>
            </>
          )}

          {step === "password" && (
            <>
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-white mb-2">New Password</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Choose a strong password</p>
              </div>
              <div className="space-y-4">
                <div className="input-with-icons">
                  <span className="input-with-icons__leading">
                    <Lock className="w-4 h-4 shrink-0" aria-hidden />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-with-icons__field"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <span className="input-with-icons__trail">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </span>
                </div>
                <div className="input-with-icons">
                  <span className="input-with-icons__leading">
                    <Lock className="w-4 h-4 shrink-0" aria-hidden />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-with-icons__field pr-4"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    autoComplete="new-password"
                  />
                </div>
                <button onClick={handleResetPassword} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Reset Password</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Remember it?{" "}
          <Link href="/login" className="text-indigo-400 font-medium hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
