import AvatarUploader from "./AvatarUploader";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { Icons } from "../../icons";

export default function ProfileSection({ form, avatar, errors, onChange, onAvatarChange }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell readers a little about yourself.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center">
          <AvatarUploader
            value={avatar}
            onChange={onAvatarChange}
          />
        </div>

        <Textarea
          label="Bio"
          rows={6}
          value={form.bio}
          error={errors.bio}
          placeholder="Introduce yourself..."
          onChange={(e) => onChange("bio", e.target.value)}
        />

        <Input
          label="Website"
          type="url"
          value={form.website || ""}
          placeholder="https://yourwebsite.com"
          icon={<Icons.link className="h-4 w-4" />}
          onChange={(e) => onChange("website", e.target.value)}
        />
      </div>
    </div>
  );
}
