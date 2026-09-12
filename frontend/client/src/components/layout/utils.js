import { Icons } from "../../icons";

export const navLinks = [
  { to: "/", label: "Home" },
  { to: "/feed", label: "Feed" },
  { to: "/trending", label: "Trending" },
];

export const tabs = [
  { to: "/", label: "Home", icon: Icons.home },
  { to: "/feed", label: "Feed", icon: Icons.document },
  { to: "/trending", label: "Trending", icon: Icons.sparkles },
  { to: "/profile", label: "Profile", icon: Icons.user },
];


export function getDropdownItems(navigate) {
  return [
    {
      label: "Profile",
      icon: Icons.user,
      onClick: () => navigate("/profile"),
    },
    {
      label: "My Bookings",
      icon: Icons.book,
      onClick: () => navigate("/bookings"),
    },
    {
      label: "Settings",
      icon: Icons.settings,
      onClick: () => navigate("/settings"),
    },
  ];
}
