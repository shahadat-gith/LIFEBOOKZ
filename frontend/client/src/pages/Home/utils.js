import Icons from "../../icons";

export const SOCIAL_LINKS = [
  { name: "Instagram", href: "#", icon: Icons.instagram, ariaLabel: "Instagram" },
  { name: "Facebook", href: "#", icon: Icons.facebook, ariaLabel: "Facebook" },
  { name: "X", href: "#", icon: Icons.twitter, ariaLabel: "X (formerly Twitter)" },
  { name: "YouTube", href: "#", icon: Icons.youtube, ariaLabel: "YouTube" },
  { name: "LinkedIn", href: "#", icon: Icons.linkedin, ariaLabel: "LinkedIn" },
];

export const STATS = [
  { key: "storiesShared", value: "10K+", label: "Stories Shared" },
  { key: "authors", value: "2K+", label: "Authors" },
  { key: "activeReaders", value: "15K+", label: "Active Readers" },
];


export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};
