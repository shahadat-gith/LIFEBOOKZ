import { motion } from "framer-motion";

import OtpInput from "../../../components/auth/OtpInput";
import Button from "../../../components/ui/Button";
import FormError from "../../../components/common/FormError";
import { CODE_LENGTH, slide } from "../utils";

/** Step 2 — type the code that arrived by email, or ask for a new one. */
export default function OtpStep({
  otp,
  onOtpChange,
  code,
  error,
  loading,
  onSubmit,
  onResend,
}) {
  return (
    <motion.div key="otp" {...slide}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="mb-3 block text-center text-sm font-medium text-foreground">
            Enter OTP
          </label>
          <OtpInput value={otp} onChange={onOtpChange} />
        </div>

        <FormError>{error}</FormError>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          disabled={code.length !== CODE_LENGTH}
          className="mt-2"
        >
          Verify OTP
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onResend}
            className="text-xs font-medium text-primary hover:underline"
          >
            Resend OTP
          </button>
        </div>
      </form>
    </motion.div>
  );
}
