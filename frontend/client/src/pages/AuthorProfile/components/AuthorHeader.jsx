import Avatar from "../../../components/ui/Avatar";
import FollowButton from "../../../components/story/FollowButton";
import { Icons } from "../../../icons";
import { isVerifiedAuthor } from "../../../utils/authors";

import SocialLinks from "./SocialLinks";
import { filledSocialLinks, profileMeta, profileStats } from "../utils";

/** One entry of the stat strip. */
function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center sm:items-start">
      <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

/**
 * Who the author is: face, name, handle, bio, the follow action and the
 * numbers behind it.
 *
 * The follow state arrives with the profile payload, so the button is correct
 * on the first paint and the page owns it from there (`onToggle`).
 */
export default function AuthorHeader({ author = {}, following = false, onToggle }) {
  const name = author.fullName || "Anonymous Author";
  const meta = profileMeta(author);
  const stats = profileStats(author);
  const links = filledSocialLinks(author.socialLinks);

  return (
    <div className="flex flex-col items-center gap-6 border-b border-border/60 pb-8 sm:flex-row sm:items-start">
      <Avatar
        src={author.avatar?.url}
        name={name}
        size="xl"
        className="shrink-0 ring-2 ring-border/60"
      />

      <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
        <div>
          <h1 className="flex items-center justify-center gap-1.5 font-display text-2xl font-bold text-foreground sm:justify-start sm:text-3xl">
            <span className="truncate">{name}</span>
            {isVerifiedAuthor(author) && (
              <Icons.verified
                aria-label="Verified author"
                title="Verified author"
                className="h-6 w-6 shrink-0 text-info sm:h-7 sm:w-7"
              />
            )}
          </h1>

          {meta.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground sm:justify-start">
              {meta.map((part) => (
                <span key={part}>{part}</span>
              ))}
            </div>
          )}
        </div>

        {author.bio && (
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:mx-0">
            {author.bio}
          </p>
        )}

        <div className="flex flex-col items-center gap-5 pt-1 sm:flex-row">
          <FollowButton
            authorId={author._id}
            size="md"
            following={following}
            onToggle={onToggle}
          />

          <div className="flex items-center gap-6">
            {stats.map((stat) => (
              <Stat key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>

        <SocialLinks links={links} />
      </div>
    </div>
  );
}
