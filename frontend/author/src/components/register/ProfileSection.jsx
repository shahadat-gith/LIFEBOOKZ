import { useEffect, useState } from "react";
import Textarea from "../ui/Textarea";
import { Icons } from "../../icons";

export default function ProfileSection({
  form,
  avatar,
  errors,
  onChange,
  onAvatarChange,
}) {
  const [preview, setPreview] = useState("");

  // Manage avatar object URL lifecycle for image preview
  useEffect(() => {
    if (!avatar) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(avatar);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-muted/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icons.book className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Profile</h2>
          <p className="text-xs text-muted-foreground">
            Tell readers about yourself
          </p>
        </div>
      </div>

      {/* Section Content */}
      <div className="p-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
          {/* Avatar Uploader Block */}
          <div className="flex flex-col items-center flex-shrink-0">
            <label className="group relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onAvatarChange(file);
                }}
              />

              <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition group-hover:border-primary">
                {preview ? (
                  <img
                    src={preview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icons.user className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="absolute bottom-1 right-1 rounded-full bg-primary p-2 text-white shadow-lg">
                <Icons.camera className="h-4 w-4" />
              </div>
            </label>

            <p className="mt-3 text-xs text-muted-foreground">
              JPG, PNG &bull; Max 10 MB
            </p>

            {avatar && (
              <p className="mt-1 max-w-[180px] truncate text-center text-sm font-medium">
                {avatar.name}
              </p>
            )}
          </div>

          {/* Bio Field */}
          <div className="flex-1 w-full space-y-5">
            <Textarea
              label="Bio *"
              rows={6}
              value={form.bio}
              error={errors.bio}
              placeholder="Describe yourself..."
              onChange={(e) => onChange("bio", e.target.value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}