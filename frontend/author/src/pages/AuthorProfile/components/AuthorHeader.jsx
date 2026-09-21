import Avatar from "../../../components/ui/Avatar";
import FollowAuthorButton from "../../../components/common/FollowAuthorButton";
import { Icons } from "../../../icons";
import { isVerifiedAuthor } from "../../../utils/authors";
import SocialLinks from "./SocialLinks";
import { filledSocialLinks, joinedLabel } from "../utils";

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
 * Who this author is, and the one action their profile exists for:
 * following them. The follow state comes in with the profile, so the button
 * is controlled from here.
 */
export default function AuthorHeader({ author, following, onFollowChange }) {
  const name = author.fullName || "Anonymous Author";
  const isVerified = isVerifiedAuthor(author);
  const socialLinks = filledSocialLinks(author.socialLinks);
  const joined = joinedLabel(author.createdAt);
  const stats = author.stats || {};

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
            {isVerified && (
              <Icons.verified
                aria-label="Verified author"
                className="h-6 w-6 shrink-0 text-info sm:h-7 sm:w-7"
              />
            )}
          </h1>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground sm:justify-start">
            {author.username && <span>@{author.username}</span>}
            {author.profession && (
              <span className="font-semibold uppercase tracking-wider">
                {author.profession}
              </span>
            )}
            {joined && <span>{joined}</span>}
          </div>
        </div>

        {author.bio && (
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:mx-0">
            {author.bio}
          </p>
        )}

        <div className="flex flex-col items-center gap-5 pt-1 sm:flex-row sm:items-center">
          <FollowAuthorButton
            authorId={author._id}
            size="md"
            isSelf={author.isSelf}
            following={following}
            onToggle={onFollowChange}
          />

          <div className="flex items-center gap-6">
            <Stat value={stats.followers || 0} label="Followers" />
            <Stat value={stats.stories || 0} label="Stories" />
            <Stat value={stats.likes || 0} label="Likes" />
          </div>
        </div>

        <SocialLinks links={socialLinks} />
      </div>
    </div>
  );
}
