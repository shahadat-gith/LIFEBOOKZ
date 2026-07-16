import type { RegisterRequest } from "../../types";

import Input from "../ui/Input";
import { Icons } from "../../icons";

interface Props {
  form: RegisterRequest;
  errors: Partial<Record<keyof RegisterRequest, string>>;
  onChange: <K extends keyof RegisterRequest>(
    field: K,
    value: RegisterRequest[K],
  ) => void;
}

export default function AccountSection({ form, errors, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Basic information for your author account.
        </p>
      </div>

      <div className="space-y-5">
        <Input
          label="Full Name"
          value={form.fullName}
          error={errors.fullName}
          icon={<Icons.user className="h-4 w-4" />}
          onChange={(e) => onChange("fullName", e.target.value)}
        />

        <Input
          label="Profession"
          value={form.profession}
          placeholder="Writer, Poet, Journalist..."
          error={errors.profession}
          icon={<Icons.edit className="h-4 w-4" />}
          onChange={(e) => onChange("profession", e.target.value)}
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          error={errors.email}
          icon={<Icons.mail className="h-4 w-4" />}
          onChange={(e) => onChange("email", e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          showPasswordToggle
          value={form.password}
          error={errors.password}
          icon={<Icons.lock className="h-4 w-4" />}
          onChange={(e) => onChange("password", e.target.value)}
        />

        <p className="text-xs text-muted-foreground">
          Use at least 8 characters with a mix of letters and numbers.
        </p>
      </div>
    </div>
  );
}
