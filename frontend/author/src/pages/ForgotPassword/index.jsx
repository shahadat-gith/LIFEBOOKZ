import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

import api from "../../config/api";
import { apiErrorMessage } from "../../utils/helpers";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";
import NewPasswordForm from "../../components/auth/NewPasswordForm";
import OtpInput from "../../components/auth/OtpInput";
import ResetProgress from "../../components/auth/ResetProgress";
import FormError from "../../components/common/FormError";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Icons } from "../../icons";

const CODE_LENGTH = 6;
const EMPTY_CODE = Array(CODE_LENGTH).fill("");

/** Each step slides in from the right, so the flow reads forwards. */
const slide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 },
};

/**
 * Forgot password — three steps in one page: send the OTP, verify it, then
 * choose a new password (which the shared form handles, success included).
 */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(EMPTY_CODE);
  const [resetToken, setResetToken] = useState("");

  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const code = otp.join("");

  /* ---------- Step 1 — send the code ---------- */
  async function sendOtp(event) {
    event?.preventDefault();
    if (!email) return;

    setError("");
    setSending(true);
    try {
      await api.post("/authors/forgot-password", { email });
      setOtp(EMPTY_CODE);
      setStep(2);
      toast.success("OTP sent if account exists.");
    } catch (err) {
      setError(apiErrorMessage(err, "Something went wrong."));
    } finally {
      setSending(false);
    }
  }

  /* ---------- Step 2 — verify it ---------- */
  async function verifyOtp(event) {
    event.preventDefault();

    if (code.length !== CODE_LENGTH) {
      setError(`Please enter the full ${CODE_LENGTH}-digit OTP.`);
      return;
    }

    setError("");
    setVerifying(true);
    try {
      const res = await api.post("/authors/verify-reset-otp", {
        email,
        otp: code,
      });
      setResetToken(res.data.data.resetToken);
      setStep(3);
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid or expired OTP."));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <AuthShell>
      {/* Header */}
      <div className="mb-6 text-center">
        {step === 3 && (
          <button
            type="button"
            onClick={() => {
              setStep(2);
              setError("");
            }}
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icons.arrowLeft className="h-3 w-3" /> Back to OTP
          </button>
        )}

        {step === 2 && (
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Icons.mail className="h-7 w-7 text-primary" />
          </div>
        )}

        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {step === 1 ? "Forgot password?" : step === 2 ? "Check your email" : "Set new password"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {step === 1 &&
            "Enter your email and we'll send you a reset OTP."}
          {step === 2 && (
            <>
              We&apos;ve sent a {CODE_LENGTH}-digit OTP to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </>
          )}
          {step === 3 && "Enter your new password below."}
        </p>
      </div>

      <ResetProgress step={step} />

      {step === 2 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-800/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <Icons.infoCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
              <p className="font-medium">Don&apos;t see the email?</p>
              <p>
                Check your <strong>spam</strong> or <strong>promotions</strong>{" "}
                folder.
              </p>
              <p className="text-xs opacity-80">
                Add{" "}
                <span className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs dark:bg-amber-900/40">
                  noreply@lifebookz.com
                </span>{" "}
                to your contacts.
              </p>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="email" {...slide}>
            <form onSubmit={sendOtp} className="space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  if (error) setError("");
                  setEmail(e.target.value);
                }}
                placeholder="Enter your email"
                required
                icon={<Icons.mail className="h-4 w-4" />}
              />

              <FormError>{error}</FormError>

              <Button type="submit" fullWidth size="lg" loading={sending} className="mt-2">
                Send OTP
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="text-xs font-medium text-primary hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="otp" {...slide}>
            <form onSubmit={verifyOtp} className="space-y-5">
              <OtpInput
                value={otp}
                onChange={(next) => {
                  if (error) setError("");
                  setOtp(next);
                }}
              />

              <FormError>{error}</FormError>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={verifying}
                disabled={code.length !== CODE_LENGTH}
                className="mt-2"
              >
                Verify OTP
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => sendOtp()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="password" {...slide}>
            <NewPasswordForm resetToken={resetToken} />
          </motion.div>
        )}
      </AnimatePresence>

      <AuthFooter prompt="Remember your password?" />
    </AuthShell>
  );
}
