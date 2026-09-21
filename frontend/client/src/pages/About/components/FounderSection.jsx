import { Icons } from "../../../icons";
import { FOUNDERS } from "../data";

const SOCIALS = {
  linkedin: { icon: Icons.linkedin, label: "LinkedIn" },
  twitter: { icon: Icons.twitter, label: "X" },
  instagram: { icon: Icons.instagram, label: "Instagram" },
};

/** One founder card: portrait, name and role over it, then the bio. */
function FounderCard({ person }) {
  const links = Object.entries(person.socials || {}).filter(([, url]) => url);

  return (
    <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-border/60 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <img
          src={person.image}
          alt={person.name}
          className="h-72 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <h3 className="font-display text-xl font-bold text-white">
            {person.name}
          </h3>
          <p className="text-sm font-medium text-accent">{person.role}</p>
        </div>
      </div>

      <p className="px-6 py-5 text-sm leading-6 text-muted-foreground">
        {person.bio}
      </p>

      {links.length > 0 && (
        <div className="flex items-center gap-3 border-t border-border/60 px-6 py-4">
          {links.map(([key, url]) => {
            const social = SOCIALS[key];
            if (!social) return null;

            const Icon = social.icon;

            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${person.name} on ${social.label}`}
                className="text-muted-foreground transition-colors hover:text-accent"
              >
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Who built Lifebookz — a card per founder, or a placeholder until we know. */
export default function FounderSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          The Founder
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Meet the person behind the platform
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Lifebookz was built by someone who believes deeply in the power of
          personal stories. Here is the face — and the story — behind it all.
        </p>
      </div>

      {FOUNDERS.length > 0 ? (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FOUNDERS.map((person) => (
            <FounderCard key={person.name} person={person} />
          ))}
        </div>
      ) : (
        /* Placeholder shown until founder data arrives from the backend */
        <div className="mx-auto mt-12 max-w-xl rounded-[var(--radius-2xl)] border border-border/60 bg-card p-5 shadow-md">
          <div className="relative overflow-hidden rounded-[var(--radius-xl)]">
            <img
              src="/founder.jpeg"
              alt="Founder of Lifebookz"
              className="h-80 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="font-display text-xl font-bold text-white">
                Founder &amp; Creator
              </h3>
              <p className="text-sm font-medium text-accent">
                The story behind Lifebookz
              </p>
            </div>
          </div>
          <p className="px-2 py-5 text-center text-sm leading-6 text-muted-foreground">
            Founder details are on their way. This space will soon share the
            person who turned Lifebookz from an idea into a home for your
            memories.
          </p>
        </div>
      )}
    </section>
  );
}
