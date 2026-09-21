import { Icons } from "../../../icons";

/** The icons a stored social link can render as. */
const ICONS = {
  website: Icons.globe,
  x: Icons.twitter,
  twitter: Icons.twitter,
  instagram: Icons.instagram,
  linkedin: Icons.linkedin,
  facebook: Icons.facebook,
  youtube: Icons.youtube,
};

/** The author's filled-in links, or nothing at all when they have none. */
export default function SocialLinks({ links = [] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-1 sm:justify-start">
      {links.map(({ key, url }) => {
        const Icon = ICONS[key] || Icons.link;

        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={key}
            aria-label={key}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}
