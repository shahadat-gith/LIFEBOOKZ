import toast from "react-hot-toast";

import Avatar from "../../../components/ui/Avatar";
import { Icons } from "../../../icons";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * The identity card — live avatar and single 16:9 cover, matching the
 * client and expert portals. Camera buttons open the cropper; nothing is
 * uploaded until the form is saved.
 */
export default function ProfileImagesSection({
  author,
  avatarPreview,
  coverPreview,
  uploading = null,
  onFileChosen,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      {/* Cover — one 16:9 image on every screen size */}
      <div className="relative aspect-video bg-gradient-to-r from-primary via-primary to-accent/70">
        {coverPreview ? (
          <img
            src={coverPreview}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground/80">
            <Icons.photo className="h-5 w-5" />
            <span className="mt-0.5 text-xs">Add a cover image</span>
          </span>
        )}

        <button
          type="button"
          onClick={() => onFileChosen("cover")}
          aria-label="Change cover image"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm transition-colors hover:bg-card"
        >
          <Icons.camera className="h-4 w-4" />
        </button>

        {uploading === "cover" && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
            <Icons.spinner className="h-6 w-6 animate-spin text-primary-foreground" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:gap-6 sm:px-7">
        <div className="-mt-10 shrink-0 sm:-mt-12">
          <div className="relative">
            <Avatar
              src={avatarPreview}
              name={author.fullName}
              size="xl"
              className="ring-4 ring-card"
            />              <button
                type="button"
                onClick={() => onFileChosen("avatar")}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted active:scale-95"
              >
                {uploading === "avatar" ? (
                  <Icons.spinner className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Icons.camera className="h-4 w-4" />
                )}
              </button>
          </div>
        </div>

        <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
          <h2 className="truncate font-display text-xl font-extrabold text-foreground sm:text-2xl">
            {author.fullName}
          </h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {author.email}
          </p>
        </div>
      </div>
    </section>
  );
}

/** The file pickers for the two image slots. */
export function ProfileImageInputs({ onPick }) {
  return (
    <>
      <input
        ref={onPick.avatarRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          event.target.value = "";
          if (!file) return;
          if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image file.");
            return;
          }
          if (file.size > MAX_BYTES) {
            toast.error("Images must be 15 MB or smaller.");
            return;
          }
          onPick.avatar(file);
        }}
      />
      <input
        ref={onPick.coverRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          event.target.value = "";
          if (!file) return;
          if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image file.");
            return;
          }
          if (file.size > MAX_BYTES) {
            toast.error("Images must be 15 MB or smaller.");
            return;
          }
          onPick.cover(file);
        }}
      />
    </>
  );
}
