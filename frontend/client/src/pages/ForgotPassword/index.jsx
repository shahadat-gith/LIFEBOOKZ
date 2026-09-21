import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

import api from "../../config/axios";
import { apiErrorMessage } from "../../utils/helpers";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";
import NewPasswordForm from "../../components/auth/NewPasswordForm";
import ResetProgress from "../../components/auth/ResetProgress";
import { Icons } from "../../icons";

import { CODE_LENGTH, EMPTY_CODE, STEP_COPY, slide } from "./utils";
import EmailStep from "./components/EmailStep";
import OtpStep from "./components/OtpStep";
import SpamNotice from "./components/SpamNotice";

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
  const copy = STEP_COPY[step];

  /* ---------- Step 1 — send the code ---------- */
  async function sendOtp(event) {
    event?.preventDefault();
    if (!email) return;

    setError("");
    setSending(true);
    try {
      await api.post("/users/forgot-password", { email });
      setOtp(EMPTY_CODE);
      setStep(2);
      toast.success("OTP sent if account exists.");
    } catch (err) {
      setError(apiErrorMessage(err));
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
      const res = await api.post("/users/verify-reset-otp", {
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

  function change(setter) {
    return (event) => {
      if (error) setError("");
      setter(event.target.value);
    };
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
          {copy.title}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {copy.subtitle}
          {step === 2 && (
            <>
              {" "}
              <span className="font-medium text-foreground">{email}</span>
            </>
          )}
        </p>
      </div>

      <ResetProgress step={step} />

      {step === 2 && <SpamNotice />}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <EmailStep
            email={email}
            onEmailChange={change(setEmail)}
            error={error}
            loading={sending}
            onSubmit={sendOtp}
          />
        )}

        {step === 2 && (
          <OtpStep
            otp={otp}
            onOtpChange={(next) => {
              if (error) setError("");
              setOtp(next);
            }}
            code={code}
            error={error}
            loading={verifying}
            onSubmit={verifyOtp}
            onResend={() => sendOtp()}
          />
        )}

        {step === 3 && (
          <motion.div key="password" {...slide}>
            <NewPasswordForm resetToken={resetToken} />
          </motion.div>
        )}
      </AnimatePresence>

      {step === 1 && (
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-xs font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      )}

      <AuthFooter prompt="Remember your password?" />
    </AuthShell>
  );
}
