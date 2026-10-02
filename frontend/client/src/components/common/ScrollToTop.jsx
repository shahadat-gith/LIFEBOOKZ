import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window back to the top whenever the route changes, so every page
 * opens at its beginning instead of keeping the previous scroll position.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
