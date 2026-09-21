import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Button from "../ui/Button";
import { Icons } from "../../icons";

/** Shown once a password has been changed, from either reset flow. */
export default function ResetSuccess() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 text-center"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <Icons.checkCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Password reset!
        </h2>
        <p className="text-sm text-muted-foreground">
          Your password has been successfully updated.
        </p>
      </div>
      <Button
        type="button"
        fullWidth
        size="lg"
        onClick={() => navigate("/login")}
        className="mt-2"
      >
        Sign in with new password
      </Button>
    </motion.div>
  );
}
