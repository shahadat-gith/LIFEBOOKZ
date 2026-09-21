import { Link } from "react-router-dom";

/**
 * The line under an auth form that sends the reader to the other one
 * ("Already have an account? Sign in"). Every auth screen closes with one,
 * so the wording is passed in and the markup lives here.
 */
export default function AuthFooter({ prompt, linkLabel = "Sign in", to = "/login" }) {
  return (
    <div className="mt-6 border-t border-border/40 pt-6 text-center">
      <p className="text-sm text-muted-foreground">
        {prompt}{" "}
        <Link
          to={to}
          className="font-semibold text-primary transition-colors hover:underline"
        >
          {linkLabel}
        </Link>
      </p>
    </div>
  );
}
