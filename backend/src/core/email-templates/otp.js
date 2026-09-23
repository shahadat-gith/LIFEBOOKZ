import { layout, BRAND } from "./layout.js";

/**
 * One-time password mail for password resets.
 *
 * The code is the whole message, so it sits in a large monospaced block that
 * is easy to read on a phone and easy to copy on a desktop.
 */
export function otpEmail({ otp, role = "user" }) {
  const subject =
    role === "user"
      ? "LifeBookz - Password Reset OTP"
      : `LifeBookz - ${role[0].toUpperCase()}${role.slice(1)} Password Reset OTP`;

  return {
    subject,
    html: layout({
      preheader: `Your LifeBookz password reset code is ${otp}.`,
      heading: "Reset your password",
      body: `
        <p style="margin:0">Use the code below to reset the password on your LifeBookz ${role} account.</p>
        <div style="margin:24px 0;padding:16px;background:${BRAND.background};border:1px solid ${BRAND.border};border-radius:12px;text-align:center">
          <div style="font-family:'Courier New',monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:${BRAND.primary}">${otp}</div>
        </div>
        <p style="margin:0">This code is valid for 10 minutes and can be used once.</p>
        <p style="margin:16px 0 0">If you didn&apos;t request this, you can safely ignore this email — your password stays unchanged.</p>
      `,
    }),
  };
}
