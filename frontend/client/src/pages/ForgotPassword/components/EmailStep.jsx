import { motion } from "framer-motion";

import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import FormError from "../../../components/common/FormError";
import { Icons } from "../../../icons";
import { slide } from "../utils";

/** Step 1 — ask for the email address the code should go to. */
export default function EmailStep({ email, onEmailChange, error, loading, onSubmit }) {
  return (
    <motion.div key="email" {...slide}>
      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={onEmailChange}
          placeholder="Enter your email"
          required
          icon={<Icons.mail className="h-4 w-4" />}
        />

        <FormError>{error}</FormError>

        <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
          Send OTP
        </Button>
      </form>
    </motion.div>
  );
}
