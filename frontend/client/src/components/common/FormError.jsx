import { motion } from "framer-motion";
import { Icons } from "../../icons";

/**
 * The inline error shown above a form's submit button.
 *
 * Login, register, forgot-password and reset-password all report a failed
 * submit the same way, so the banner is defined once and the form just passes
 * the message it got back from the API.
 */
export default function FormError({ children, className = "" }) {
  if (!children) return null;

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive ${className}`}
    >
      <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </motion.div>
  );
}
