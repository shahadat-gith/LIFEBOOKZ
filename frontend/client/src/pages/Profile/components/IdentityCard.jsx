import { Icons } from "../../../icons";
import { formatJoined } from "../utils";

/**
 * The identity card: the cover banner (which swaps to the mobile crop on
 * phones), the avatar with its change button, and the member's name,
 * username, email and join date.
 *
 * Its buttons open the pickers rendered by `ProfileImageInputs`.
 */
export default function IdentityCard({
  user,
  avatarSrc,
  coverPreviews,
  avatarInputRef,
  coverInputRefs,
}) {
  const hasCover = Boolean(coverPreviews.desktop || coverPreviews.mobile);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      <div className="relative h-24 bg-gradient-to-r from-primary via-primary to-accent/70 sm:h-28">
        {hasCover ? (
          <picture>
            {coverPreviews.mobile && (
              <source media="(max-width: 639px)" srcSet={coverPreviews.mobile} />
            )}
            {coverPreviews.desktop && (
              <img
                src={coverPreviews.desktop}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </picture>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRefs.desktop.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground/80 transition-colors hover:text-primary-foreground"
          >
            <Icons.image className="h-5 w-5" />
            <span className="mt-0.5 text-xs">Add a cover image</span>
          </button>
        )}

        {hasCover && (
          <button
            type="button"
            onClick={() => coverInputRefs.desktop.current?.click()}
            aria-label="Change cover image"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm transition-colors hover:bg-card"
          >
            <Icons.camera className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:gap-6 sm:px-7">
        <div className="-mt-12 shrink-0 sm:-mt-14">
          <div className="relative">
            <img
              src={avatarSrc?.trim() || "/user.png"}
              alt={user?.fullName || "Your avatar"}
              className="h-24 w-24 rounded-full border-4 border-card bg-muted/40 object-cover shadow-md sm:h-28 sm:w-28"
            />

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Change profile photo"
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted active:scale-95"
            >
              <Icons.camera className="h-4 w-4" />
            </button>
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
