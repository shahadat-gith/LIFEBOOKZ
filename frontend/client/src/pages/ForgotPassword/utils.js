/** Digits in the emailed one-time code. */
export const CODE_LENGTH = 6;

/** A fresh, empty code — one box per digit. */
export const EMPTY_CODE = Array(CODE_LENGTH).fill("");

/** Each step slides in from the right, so the flow reads forwards. */
export const slide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 },
};

/** Heading and supporting line for each of the three steps. */
export const STEP_COPY = {
  1: {
    title: "Forgot password?",
    subtitle: "Enter your email and we'll send you a reset OTP.",
  },
  2: {
    title: "Check your email",
    subtitle: `We've sent a ${CODE_LENGTH}-digit OTP to`,
  },
  3: {
    title: "Set new password",
    subtitle: "Enter your new password below.",
  },
};
