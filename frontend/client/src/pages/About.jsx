import { Link } from "react-router-dom";
import { Icons } from "../icons";

/**
 * Founder data — will be fetched from the backend API.
 * Expected shape of each founder entry:
 * {
 *   name: string,            // e.g. "Jane Doe"
 *   role: string,            // e.g. "Founder & Creator"
 *   bio: string,             // short biography paragraph
 *   image: string,           // photo URL or path (e.g. "/founder.jpeg")
 *   socials: {               // optional social links
 *     linkedin: string,
 *     twitter: string,
 *     instagram: string,
 *   },
 * }
 */
const founder = [];

const VALUES = [
  {
    icon: Icons.book,
    title: "Authentic Storytelling",
    description:
      "Real lives, real voices. We help people capture their journeys in their own words, exactly as they lived them.",
  },
  {
    icon: Icons.shieldCheck,
    title: "Privacy First",
    description:
      "Personal history deserves protection. We treat every memory with the care and confidentiality it deserves.",
  },
  {
    icon: Icons.sparkles,
    title: "Legacy, Preserved",
    description:
      "From family recipes to life lessons, we make it effortless to pass your story on to future generations.",
  },
  {
    icon: Icons.globe,
    title: "A Community of Lives",
    description:
      "Read, connect, and celebrate the extraordinary within the ordinary — together, one life at a time.",
  },
];

const authorPortalUrl =
  import.meta.env.VITE_AUTHOR_PORTAL || "https://author.lifebookz.com";

export function AboutPage() {
  return (
    <div className="relative overflow-hidden bg-background text-foreground">
      {/* SECTION 1: HEADER */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[720px] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-20 lg:px-8">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Our Story
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            About Lifebookz
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Lifebookz is a home for the stories that shape us. We believe every
            life is worth recording — and that the people who matter most should
            be able to revisit yours, forever.
          </p>
        </div>
      </header>

      {/* SECTION 2: MISSION */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Our Mission
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Every memory deserves a home.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
              <p>
                Life began as a simple idea: our most important stories were
                being lost. Photographs fade, voices grow quiet, and the little
                details that make a life remarkable slip away with time.
              </p>
              <p>
                We built Lifebookz so that no one's story has to disappear.
                Whether it's a grandmother's childhood in another country, a
                hard-won career milestone, or the everyday moments that made you
                who you are — we give you a beautiful, lasting place to keep
                them.
              </p>
              <p>
                And because the best stories deserve to be heard, we pair every
                legacy with a community of readers who can follow along, learn,
                and be moved by the lives of others.
              </p>
            </div>
          </div>

          {/* Framed image */}
          <div className="relative">
            <div className="absolute -left-6 -top-6 h-28 w-28 rounded-[var(--radius-xl)] bg-accent/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border/60 bg-card p-4 shadow-md">
              <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
                <img
                  src="/hero.png"
                  alt="Families and memories preserved on Lifebookz"
                  className="h-[420px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <p className="absolute bottom-5 left-6 right-6 font-display text-lg font-semibold text-white">
                  "The memories you keep become the legacy you leave."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: VALUES */}
      <section className="relative border-y border-border/60 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              What We Stand For
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              The values behind every story
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="group rounded-[var(--radius-xl)] border border-border/60 bg-background p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold tracking-tight">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FOUNDER */}
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

        {founder.length > 0 ? (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {founder.map((person) => (
              <div
                key={person.name}
                className="overflow-hidden rounded-[var(--radius-2xl)] border border-border/60 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
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
                    <p className="text-sm font-medium text-accent">
                      {person.role}
                    </p>
                  </div>
                </div>
                <p className="px-6 py-5 text-sm leading-6 text-muted-foreground">
                  {person.bio}
                </p>
                {person.socials && (
                  <div className="flex items-center gap-3 border-t border-border/60 px-6 py-4">
                    {person.socials.linkedin && (
                      <a
                        href={person.socials.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground transition-colors hover:text-accent"
                        aria-label={`${person.name} on LinkedIn`}
                      >
                        <Icons.linkedin className="h-4.5 w-4.5" />
                      </a>
                    )}
                    {person.socials.twitter && (
                      <a
                        href={person.socials.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground transition-colors hover:text-accent"
                        aria-label={`${person.name} on X`}
                      >
                        <Icons.twitter className="h-4.5 w-4.5" />
                      </a>
                    )}
                    {person.socials.instagram && (
                      <a
                        href={person.socials.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground transition-colors hover:text-accent"
                        aria-label={`${person.name} on Instagram`}
                      >
                        <Icons.instagram className="h-4.5 w-4.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
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
                  Founder & Creator
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

      {/* SECTION 5: CTA */}
      <section className="relative overflow-hidden border-t border-border/60 bg-primary">
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[560px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Your story matters.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-primary-foreground/70">
            Start preserving the moments that made you — today. The people you
            love will thank you forever.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={authorPortalUrl}
              className="rounded-[var(--radius-full)] bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-md transition-transform hover:-translate-y-0.5"
            >
              Write your story
            </Link>
            <Link
              to="/feed"
              className="rounded-[var(--radius-full)] border border-primary-foreground/30 px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:border-primary-foreground/60 hover:bg-primary-foreground/10"
            >
              Explore stories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
