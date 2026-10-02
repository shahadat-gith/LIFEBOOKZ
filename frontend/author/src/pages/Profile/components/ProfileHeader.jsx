import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Icons } from "../../../icons";
import { isVerifiedAuthor } from "../../../utils/authors";

/**
 * Identity-card header, matching the client and expert portals: a rounded
 * card with the single 16:9 cover, overlapping avatar, name + verified
 * state, bio, meta row, and the share / menu (Edit profile, Sign out)
 * actions. The page constrains it with a max width.
 */
export default function ProfileHeader({ author, bio, onShare, onEdit }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const isApproved = isVerifiedAuthor(author);
  const joined = author.createdAt
    ? new Date(author.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "";
  const city = author.address?.city || "";
  const country = author.address?.country || "";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        {/* One 16:9 cover on every screen size — the framing the author chose
            in the cropper is exactly what shows. */}
        <div className="relative aspect-video bg-gradient-to-b from-secondary via-[#7d9cc0] to-background">
          {author.coverImage?.url && (
            <img
              src={author.coverImage.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onShare}
              aria-label="Share profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card"
            >
              <Icons.share className="h-4 w-4" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="More options"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card"
              >
                <Icons.menu className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-md">
                  <button
                    type="button"
                    onClick={() => {
                      onEdit();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <Icons.edit className="h-4 w-4" /> Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      navigate("/login");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Icons.logout className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:gap-6 sm:px-7">
          <div className="relative z-10 -mt-10 shrink-0 sm:-mt-12">
            <img
              src={author.avatar?.url?.trim() || "/user.png"}
              alt={author.fullName || "Your avatar"}
              className="h-24 w-24 rounded-full border-4 border-card bg-muted/40 object-cover shadow-md sm:h-28 sm:w-28"
            />
          </div>

          <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="truncate font-display text-2xl font-bold text-foreground sm:text-3xl">
                {author.fullName}
              </h1>
              <Icons.verified className="h-5 w-5 flex-shrink-0 text-info" />
            </div>

            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start">
              <span className="text-muted-foreground">@{author.username}</span>
              {isApproved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                  <Icons.check className="h-3 w-3" />
                  Verified Profile
                </span>
              )}
            </div>

            {bio && (
              <p className="mt-2 max-w-lg whitespace-pre-line text-sm text-foreground/90">
                {bio}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
              {(city || country) && (
                <span className="inline-flex items-center gap-1">
                  <Icons.globe className="h-3.5 w-3.5" />
                  {[city, country].filter(Boolean).join(", ")}
                </span>
              )}
              {joined && (
                <span className="inline-flex items-center gap-1">
                  <Icons.clock className="h-3.5 w-3.5" />
                  Joined {joined}
                </span>
              )}
              {author.profession && (
                <span className="inline-flex items-center gap-1">
                  <Icons.edit className="h-3.5 w-3.5" />
                  {author.profession}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
