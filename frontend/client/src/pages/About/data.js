import { Icons } from "../../icons";

/**
 * Everything the About page says, kept apart from how it is laid out.
 *
 * The founder list is still to come from the backend; until then it is empty
 * and the founder section shows its placeholder.
 * Expected shape of each entry:
 * {
 *   name: string,
 *   role: string,
 *   bio: string,
 *   image: string,
 *   socials: { linkedin?: string, twitter?: string, instagram?: string },
 * }
 */
export const FOUNDERS = [];

export const VALUES = [
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

const MISSION_PARAGRAPHS = [
  "Life began as a simple idea: our most important stories were being lost. Photographs fade, voices grow quiet, and the little details that make a life remarkable slip away with time.",
  "We built Lifebookz so that no one's story has to disappear. Whether it's a grandmother's childhood in another country, a hard-won career milestone, or the everyday moments that made you who you are — we give you a beautiful, lasting place to keep them.",
  "And because the best stories deserve to be heard, we pair every legacy with a community of readers who can follow along, learn, and be moved by the lives of others.",
];

export { MISSION_PARAGRAPHS };

/** Where "Write your story" sends people. */
export const AUTHOR_PORTAL_URL =
  import.meta.env.VITE_AUTHOR_PORTAL || "https://author.lifebookz.com";
