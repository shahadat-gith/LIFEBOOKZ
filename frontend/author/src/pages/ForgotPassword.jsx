import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../config/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card, { CardTitle } from "../components/ui/Card";
import { Icons } from "../icons";
import toast from "react-hot-toast";

const variants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [error, setError] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loadingOTP, setLoadingOTP] = useState(false);
  const otpRefs = useRef([]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingReset, setLoadingReset] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [success, setSuccess] = useState(false);

  const [step, setStep] = useState(1);

  /* ---------- Step 1: Send OTP ---------- */
  async function handleSendOTP(e) {
    if (e) e.preventDefault();
    if (!email) return;
    setError("");
    setLoadingEmail(true);
    try {
      await api.post("/authors/forgot-password", { email });
      setOtp(["", "", "", "", "", ""]); // Clear previous OTP entries
      setStep(2);
      toast.success("OTP sent if account exists.");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Something went wrong.");
    } finally {
      setLoadingEmail(false);
    }
  }

  /* ---------- Step 2: Verify OTP ---------- */
  const otpString = otp.join("");

  async function handleVerifyOTP(e) {
    e.preventDefault();
    if (otpString.length !== 6) {
      setError("Please enter the full 6-digit OTP.");
      return;
    }
    setError("");
    setLoadingOTP(true);
    try {
      const res = await api.post("/authors/verify-reset-otp", {
        email,
        otp: otpString,
      });
      setResetToken(res.data.data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Invalid or expired OTP.");
    } finally {
      setLoadingOTP(false);
    }
  }

  function handleOTPChange(index, value) {
    if (error) setError("");
    const digit = value.replace(/\D/g, "").slice(-1); // Take the last digit if multiple were typed
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOTPKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOTPPaste(e) {
    e.preventDefault();
    if (error) setError("");
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (pasted.length === 0) return;

    const next = [...otp];
    pasted.forEach((d, i) => {
      if (i < 6) next[i] = d;
    });
    setOtp(next);
    
    const targetIndex = Math.min(pasted.length, 5);
    otpRefs.current[targetIndex]?.focus();
  }

  /* ---------- Step 3: Reset Password ---------- */
  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoadingReset(true);
    try {
      await api.post("/authors/reset-password", { resetToken, password });
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to reset password. Please request a new OTP.");
    } finally {
      setLoadingReset(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background text-foreground">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 border border-border/60 bg-card shadow-sm rounded-2xl">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-xl border border-border/80 bg-muted/30 flex items-center justify-center p-2.5 shadow-xs">
                  <img src="/logo.png" alt="Lifebookz Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s ? <Icons.check className="h-4 w-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-10 h-0.5 transition-colors duration-300 ${step > s ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-6"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Icons.checkCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl">Password reset!</CardTitle>
                  <p className="text-sm text-muted-foreground">Your password has been successfully updated.</p>
                  <Button type="button" fullWidth size="lg" onClick={() => navigate("/login")} className="mt-2">
                    Sign in with new password
                  </Button>
                </motion.div>
              ) : step === 1 ? (
                <motion.div key="email" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <div className="text-center mb-6">
                    <CardTitle className="text-2xl font-semibold font-display tracking-tight">Forgot password?</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset OTP.</p>
                  </div>
                  <form onSubmit={handleSendOTP} className="space-y-5">
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        if (error) setError("");
                        setEmail(e.target.value);
                      }}
                      placeholder="Enter your registered email"
                      required
                      icon={<Icons.mail className="h-4 w-4" />}
                    />
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-destructive flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                      >
                        <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                    <Button type="submit" fullWidth size="lg" loading={loadingEmail} className="mt-2">
                      Send OTP
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <Link to="/login" className="text-xs text-primary font-medium hover:underline">
                      Back to sign in
                    </Link>
                  </div>
                </motion.div>
              ) : step === 2 ? (
                <motion.div key="otp" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icons.mail className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Check your email</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      We've sent a 6-digit OTP to <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                      <Icons.infoCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                        <p className="font-medium">Don't see the email?</p>
                        <p>Check your <strong>spam</strong> or <strong>promotions</strong> folder.</p>
                        <p className="text-xs opacity-80">
                          Add <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">noreply@lifebookz.com</span> to your contacts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyOTP} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3 text-center">Enter OTP</label>
                      <div className="flex items-center justify-center gap-2">
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => (otpRefs.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOTPChange(i, e.target.value)}
                            onKeyDown={(e) => handleOTPKeyDown(i, e)}
                            onPaste={i === 0 ? handleOTPPaste : undefined}
                            className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                            autoComplete="one-time-code"
                          />
                        ))}
                      </div>
                    </div>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-destructive flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                      >
                        <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                    <Button type="submit" fullWidth size="lg" loading={loadingOTP} disabled={otpString.length !== 6} className="mt-2">
                      Verify OTP
                    </Button>
                    <div className="text-center">
                      <button type="button" onClick={() => handleSendOTP()} className="text-xs text-primary font-medium hover:underline">
                        Resend OTP
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="password" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <div className="text-center mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(2);
                        setError("");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
                    >
                      <Icons.arrowLeft className="h-3 w-3" /> Back to OTP
                    </button>
                    <CardTitle className="text-2xl font-semibold font-display tracking-tight">Set new password</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Enter your new password below.</p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <Input
                      label="New password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        if (error) setError("");
                        setPassword(e.target.value);
                      }}
                      placeholder="Min. 8 characters"
                      required
                      icon={<Icons.lock className="h-4 w-4" />}
                      showPasswordToggle
                    />
                    <Input
                      label="Confirm password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        if (error) setError("");
                        setConfirmPassword(e.target.value);
                      }}
                      placeholder="Re-enter new password"
                      required
                      icon={<Icons.lock className="h-4 w-4" />}
                      showPasswordToggle
                    />
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-destructive flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                      >
                        <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                    <Button type="submit" fullWidth size="lg" loading={loadingReset} className="mt-2">
                      Reset Password
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-6 pt-6 border-t border-border/40 text-center"
            >
              <p className="text-xs sm:text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}