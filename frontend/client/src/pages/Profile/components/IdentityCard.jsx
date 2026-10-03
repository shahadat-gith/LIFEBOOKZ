import { Icons } from "../../../icons";
import { formatJoined } from "../utils";

/**
 * The identity card: the 16:9 cover banner, the avatar, and the member's
 * name, username, email and join date.
 *
 * In `editable` mode its camera buttons open the pickers rendered by
 * `ProfileImageInputs`. In read-only mode the share and edit buttons show
 * on the cover, like the author portal. `uploading` ('avatar' | 'cover')
 * shows a spinner over the slot being saved.
 */
export default function IdentityCard({
  user,
  avatarSrc,
  coverSrc,
  avatarInputRef,
  coverInputRef,
  editable = false,
  uploading = null,
  onShare,
  onEdit,
}) {
  const hasCover = Boolean(coverSrc);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      {/* The crop already fixed the ratio at upload, so the banner simply
          uses: one 16:9 image on every screen size. */}
      <div className="relative aspect-video bg-gradient-to-r from-primary via-primary to-accent/70">
        {hasCover ? (
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : editable ? (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground/80 transition-colors hover:text-primary-foreground"
          >
            <Icons.image className="h-5 w-5" />
            <span className="mt-0.5 text-xs">Add a cover image</span>
          </button>
        ) : null}

        {uploading === "cover" && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
            <Icons.spinner className="h-6 w-6 animate-spin text-primary-foreground" />
          </div>
        )}

        {/* Read-only actions — share and edit, like the author portal */}
        {!editable && (onShare || onEdit) && (
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                aria-label="Share profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card"
              >
                <Icons.share className="h-4 w-4" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card"
              >
                <Icons.edit className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {hasCover && editable && (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            aria-label="Change cover image"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm transition-colors hover:bg-card"
          >
            <Icons.camera className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:gap-6 sm:px-7">
        <div className="relative z-10 -mt-10 shrink-0 sm:-mt-12">
          <div className="relative">
            <img
              src={avatarSrc?.trim() || "/user.png"}
              alt={user?.fullName || "Your avatar"}
              className="h-24 w-24 rounded-full border-4 border-card bg-muted/40 object-cover shadow-md sm:h-28 sm:w-28"
            />

            {editable && (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted active:scale-95"
              >
                {uploading === "avatar" ? (
                  <Icons.spinner className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Icons.camera className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
          <h2 className="truncate font-display text-xl font-extrabold text-foreground sm:text-2xl">
            {user?.fullName || "LifeBookz member"}
          </h2>

          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
            {user?.username && (
              <span className="inline-flex items-center gap-1.5">
                <Icons.id className="h-3.5 w-3.5" />@{user.username}
              </span>
            )}
            {user?.email && (
              <span className="inline-flex items-center gap-1.5">
                <Icons.mail className="h-3.5 w-3.5" />
                {user.email}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Icons.calendar className="h-3.5 w-3.5" />
              Joined {formatJoined(user?.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
