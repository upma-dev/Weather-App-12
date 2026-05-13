"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";

type Step = "form" | "otp";
type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp") {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleRegister = async () => {
    if (!name || !email || !password) return toast.error("Fill all fields");
    if (password.length < 6) return toast.error("Password min 6 chars");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Account created! Please login.");
      setMode("login");
      setName("");
      setPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return toast.error("Fill all fields");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (typeof data.email === "string" && data.email) setEmail(data.email);
      toast.success("OTP sent to your email!");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpStr = otp.join("");
    if (otpStr.length !== 6) return toast.error("Enter complete 6-digit OTP");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Login successful! Welcome back 🌤");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (typeof data.email === "string" && data.email) setEmail(data.email);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      toast.success("New OTP sent!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="orb w-96 h-96 bg-indigo-600/20 -top-32 -left-32" />
      <div className="orb w-80 h-80 bg-teal-500/15 bottom-0 right-0" />
      <div className="orb w-64 h-64 bg-purple-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Floating weather icons */}
      <div className="fixed top-12 left-12 opacity-10 text-6xl animate-float pointer-events-none">☁️</div>
      <div className="fixed top-24 right-16 opacity-10 text-4xl animate-float pointer-events-none" style={{ animationDelay: "2s" }}>⛅</div>
      <div className="fixed bottom-16 left-24 opacity-10 text-5xl animate-float pointer-events-none" style={{ animationDelay: "4s" }}>🌤</div>
      <div className="fixed bottom-32 right-12 opacity-10 text-3xl animate-float pointer-events-none" style={{ animationDelay: "1s" }}>🌧</div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 relative"
            style={{ background: "linear-gradient(135deg, #6366f1, #00d4aa)" }}>
            <span className="text-4xl">🌤</span>
            <div className="absolute inset-0 rounded-3xl" style={{
              background: "linear-gradient(135deg, #6366f1, #00d4aa)",
              filter: "blur(16px)",
              opacity: 0.4,
              zIndex: -1,
            }} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">WeatherApp</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Your personal weather intelligence
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-full">
          {step === "form" && (
            <>
              {/* Mode toggle */}
              <div className="flex rounded-2xl p-1 mb-8"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                  onClick={() => setMode("login")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === "login"
                    ? "text-white shadow-lg"
                    : "text-white/40 hover:text-white/70"
                  }`}
                  style={mode === "login" ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)" } : {}}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === "register"
                    ? "text-white shadow-lg"
                    : "text-white/40 hover:text-white/70"
                  }`}
                  style={mode === "register" ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)" } : {}}
                >
                  Sign Up
                </button>
              </div>

              <div className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Full Name
                    </label>
                    <div className="input-with-icons">
                      <span className="input-with-icons__leading">
                        <User className="w-4 h-4 shrink-0" aria-hidden />
                      </span>
                      <input
                        type="text"
                        className="input-with-icons__field pr-4"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Email Address
                  </label>
                  <div className="input-with-icons">
                    <span className="input-with-icons__leading">
                      <Mail className="w-4 h-4 shrink-0" aria-hidden />
                    </span>
                    <input
                      type="email"
                      className="input-with-icons__field pr-4"
                      placeholder="name@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Password
                  </label>
                  <div className="input-with-icons">
                    <span className="input-with-icons__leading">
                      <Lock className="w-4 h-4 shrink-0" aria-hidden />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-with-icons__field"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
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
                </div>

                {mode === "login" && (
                  <div className="text-right">
                    <Link href="/forgot-password" className="text-xs font-medium transition-colors hover:text-indigo-400"
                      style={{ color: "rgba(255,255,255,0.4)" }}>
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button
                  onClick={mode === "login" ? handleLogin : handleRegister}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Send OTP & Continue" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {mode === "login" && (
                <div className="mt-6 flex items-center gap-2">
                  <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>2FA via email OTP</span>
                  <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                </div>
              )}
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(0,212,170,0.2))", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <Mail className="w-7 h-7 text-indigo-400" />
                </div>
                <h2 className="font-display text-xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  We sent a 6-digit code to
                </p>
                <p className="text-sm font-semibold text-indigo-400 mt-1">{email}</p>
              </div>

              {/* OTP inputs */}
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-8 max-w-full px-0.5" onPaste={handleOTPPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(i, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                    className={`otp-input ${digit ? "filled" : ""}`}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join("").length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify & Login <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setStep("form"); setOtp(["", "", "", "", "", ""]); }}
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  ← Back
                </button>
                <button
                  onClick={resendOTP}
                  disabled={loading}
                  className="text-sm font-medium transition-colors hover:text-indigo-300"
                  style={{ color: "rgba(99,102,241,0.7)" }}
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)" }}>
          Secured with 2FA · Powered by OpenWeatherMap
        </p>
      </div>
    </div>
  );
}
