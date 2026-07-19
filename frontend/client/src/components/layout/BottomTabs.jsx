import { Link, useLocation } from "react-router-dom";
import { Icons } from "../../icons";

const tabs = [
  { to: "/", label: "Home", icon: Icons.home },
  { to: "/feed", label: "Feed", icon: Icons.document },
  { to: "/authors", label: "Authors", icon: Icons.user },
  { to: "/trending", label: "Trending", icon: Icons.sparkles },
];

export default function BottomTabs() {
  const location = useLocation();

  return (
    <>
      <div className="h-24 md:hidden" />
      <nav className="fixed bottom-5 left-4 right-4 z-50 md:hidden">
        <div className="flex items-center justify-around rounded-2xl border border-border/80 bg-card/75 backdrop-blur-lg shadow-lg px-2 py-2 select-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.to === "/" 
              ? location.pathname === "/" 
              : location.pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-all duration-200 tap-highlight-transparent active:scale-95"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                  active ? "bg-primary text-primary-foreground shadow-sm scale-105" : "text-muted-foreground hover:text-foreground"
                }`}>
                  <Icon className="h-4 w-4 stroke-[2.2]" />
                </div>
                <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                  active ? "text-primary font-semibold" : "text-muted-foreground/80"
                }`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
