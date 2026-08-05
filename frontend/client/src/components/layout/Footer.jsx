import { Link } from "react-router-dom";
import { Icons } from "../../icons";

export function Footer() {

  return (
    <footer className="border-t border-border bg-card/50 text-foreground mt-auto relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div 
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[250px] rounded-full bg-accent/5 blur-3xl -z-10" 
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Brand Column (Span 4) */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="inline-block group">
              <img
                src="/logo.png"
                alt="Lifebookz"
                className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
            
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Empowering creators and readers through an elevated storytelling platform. Built for impactful narratives and quiet reading experiences.
            </p>

           
          </div>

          {/* Links Column: Explore (Span 2) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Feed
                </Link>
              </li>
              <li>
                <Link to="/trending" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Trending
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column: Legal & Policy (Span 2) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal & Safety
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Content Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Newsletter Subscription (Span 4) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Stay Connected
            </h4>
            <p className="text-sm text-muted-foreground">
              Subscribe to get curations of the top weekly stories directly to your inbox.
            </p>
            
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 pt-1">
              <input
                type="email"
                placeholder="Enter email address"
                className="w-full px-3.5 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-muted-foreground/60"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Sub-links */}
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Lifebookz. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;