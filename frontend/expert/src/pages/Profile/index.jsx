import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { CONSULT_CATEGORIES } from "../../config";
import { formatDate } from "../../utils/helpers";
import Badge from "../../components/ui/Badge";
import { Icons } from "../../icons";

/** One tile of the profile's stat strip. */
function StatTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold text-foreground">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * The expert's profile, read-only — the same identity-card layout as the
 * author portal: cover with share + menu actions, overlapping avatar, and
 * the professional details below. Editing lives on `/profile/edit`.
 */
export default function Profile() {
  const { expert } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!expert) navigate("/login", { replace: true });
  }, [expert, navigate]);

  if (!expert) return null;

  const isApproved = expert.verification?.status === "approved";
  const isRejected = expert.verification?.status === "rejected";
  const coverSrc = expert.coverImage?.url;
  const categoryLabels = (expert.categories || [])
    .map((id) => CONSULT_CATEGORIES.find((c) => c.id === id)?.label || id)
    .filter(Boolean);

  function handleShare() {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({ title: expert.fullName, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-10">
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        {/* Identity card */}
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          {/* One 16:9 cover on every screen size */}
          <div className="relative aspect-video bg-gradient-to-r from-primary via-primary to-accent/70">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}

            <div className="absolute right-4 top-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card"
              >
                <Icons.share className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/profile/edit")}
                aria-label="Edit profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card"
              >
                <Icons.edit className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:gap-6 sm:px-7">
            <div className="relative z-10 -mt-10 shrink-0 sm:-mt-12">
              <img
                src={expert.avatar?.url?.trim() || "/user.png"}
                alt={expert.fullName || "Your avatar"}
                className="h-24 w-24 rounded-full border-4 border-card bg-muted/40 object-cover shadow-md sm:h-28 sm:w-28"
              />
            </div>

            <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="truncate font-display text-2xl font-bold text-foreground sm:text-3xl">
                  {expert.fullName}
                </h1>
                {isApproved && (
                  <Icons.verified className="h-5 w-5 flex-shrink-0 text-info" />
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
                {expert.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icons.mail className="h-3.5 w-3.5" />
                    {expert.email}
                  </span>
                )}
                {expert.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icons.phone className="h-3.5 w-3.5" />
                    {expert.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Icons.calendar className="h-3.5 w-3.5" />
                  Joined {formatDate(expert.createdAt)}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant={isApproved ? "success" : isRejected ? "danger" : "warning"}>
                  {isApproved
                    ? "Verified Expert"
                    : isRejected
                      ? "Application Rejected"
                      : "Pending Approval"}
                </Badge>
                {expert.rating > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {expert.rating.toFixed(1)} ★
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={Icons.checkCircle}
            label="Sessions"
            value={expert.sessions ?? 0}
            hint="Consultations given"
          />
          <StatTile
            icon={Icons.starSolid}
            label="Rating"
            value={expert.rating > 0 ? expert.rating.toFixed(1) : "—"}
            hint="From client feedback"
          />
          <StatTile
            icon={Icons.money}
            label="Session price"
            value={expert.price > 0 ? `$${expert.price}` : "—"}
            hint="Per session"
          />
          <StatTile
            icon={Icons.clock}
            label="Experience"
            value={`${expert.experience ?? 0} yrs`}
            hint="In your field"
          />
        </div>

        {/* Professional details */}
        <section className="mt-6 rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:p-7">
          <h2 className="font-display text-lg font-bold text-foreground">
            Professional details
          </h2>

          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Area of expertise
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {expert.expertise || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Qualification
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {expert.qualification || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Languages
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {(expert.languages || []).join(", ") || "—"}
              </dd>
            </div>
          </dl>

          {categoryLabels.length > 0 && (
            <div className="mt-6 border-t border-border/60 pt-5">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Consultancy categories
              </dt>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {categoryLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {expert.bio && (
            <div className="mt-6 border-t border-border/60 pt-5">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                About
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-foreground/90">
                {expert.bio}
              </dd>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
