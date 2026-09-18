import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import { Icons } from "../../icons";

/**
 * Gradient cover header: cover image (or navy horizon gradient),
 * overlapping avatar, name + verified state, bio, meta row, and
 * the share / menu (Edit profile, Sign out) actions.
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

  const isApproved = author.verification?.status === "approved";
  const joined = author.createdAt
    ? new Date(author.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "";
  const city = author.address?.city || "";
  const country = author.address?.country || "";

  return (
    <div className="relative">
      <div className="relative h-44 sm:h-64 lg:h-80 overflow-hidden bg-gradient-to-b from-secondary via-[#7d9cc0] to-background">
        {author.coverImage?.url && (
          // Phone-sized screens get the tighter 4:3 crop when the author
          // uploaded one; larger screens use the wide 16:5 banner.
          <picture>
            {author.coverImageMobile?.url && (
              <source
                media="(max-width: 639px)"
                srcSet={author.coverImageMobile.url}
              />
            )}
            <img
              src={author.coverImage.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </picture>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-transparent to-background/90" />

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            aria-label="Share profile"
            className="w-9 h-9 rounded-full bg-card/85 backdrop-blur flex items-center justify-center text-foreground shadow-sm hover:bg-card transition-colors"
          >
            <Icons.share className="h-4 w-4" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="More options"
              className="w-9 h-9 rounded-full bg-card/85 backdrop-blur flex items-center justify-center text-foreground shadow-sm hover:bg-card transition-colors"
            >
              <Icons.menu className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-popover shadow-md p-1.5 z-20">
                <button
                  type="button"
                  onClick={() => {
                    onEdit();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Icons.edit className="h-4 w-4" /> Edit Profile
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Icons.logout className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          <div className="relative flex-shrink-0">
            <div className="rounded-full p-1 bg-card shadow-md inline-block">
              <Avatar
                src={author.avatar?.url}
                name={author.fullName}
                size="xl"
                className="w-28 h-28 sm:w-32 sm:h-32 text-3xl ring-4 ring-card"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground truncate">
                {author.fullName}
              </h1>
              <Icons.verified className="h-5 w-5 text-info flex-shrink-0" />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">@{author.username}</span>
              {isApproved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success text-xs font-semibold px-2.5 py-0.5">
                  <Icons.check className="h-3 w-3" />
                  Verified Profile
                </span>
              )}
            </div>

            {bio && (
              <p className="mt-2 text-sm text-foreground/90 max-w-lg whitespace-pre-line">{bio}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
