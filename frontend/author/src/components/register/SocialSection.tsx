import type { RegisterRequest } from "../../types";

import Input from "../ui/Input";
import { Icons } from "../../icons";

interface Props {
  form: RegisterRequest;

  onChange: <K extends keyof RegisterRequest>(
    field: K,
    value: RegisterRequest[K],
  ) => void;
}

export default function SocialSection({
  form,
  onChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">
          Social Links
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Help readers connect with you outside of Lifebookz.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Input
          label="X (Twitter)"
          placeholder="@username"
          value={form.socialLinks.x}
          icon={<Icons.twitter className="h-4 w-4" />}
          onChange={(e) =>
            onChange("socialLinks", {
              ...form.socialLinks,
              x: e.target.value,
            })
          }
        />

        <Input
          label="Instagram"
          placeholder="@username"
          value={form.socialLinks.instagram}
          icon={<Icons.instagram className="h-4 w-4" />}
          onChange={(e) =>
            onChange("socialLinks", {
              ...form.socialLinks,
              instagram: e.target.value,
            })
          }
        />

        <Input
          label="LinkedIn"
          placeholder="linkedin.com/in/username"
          value={form.socialLinks.linkedin}
          icon={<Icons.linkedin className="h-4 w-4" />}
          onChange={(e) =>
            onChange("socialLinks", {
              ...form.socialLinks,
              linkedin: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
}