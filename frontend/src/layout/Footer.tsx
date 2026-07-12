export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent text-white font-bold text-xs">
                L
              </div>
              <span className="font-display font-bold text-foreground">Lifebookz</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Share your stories with the world. Powered by AI.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Explore</h4>
            <ul className="space-y-2">
              <li><a href="/stories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stories</a></li>
              <li><a href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Search</a></li>
              <li><a href="/stories?sort=trending" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Trending</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Community</h4>
            <ul className="space-y-2">
              <li><a href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Join as Reader</a></li>
              <li><a href="/author/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Become an Author</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-muted-foreground">Privacy Policy</span></li>
              <li><span className="text-sm text-muted-foreground">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Lifebookz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
