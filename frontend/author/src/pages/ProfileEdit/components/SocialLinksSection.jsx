import FormField from "./FormField";
import { SOCIAL_FIELDS, inputCls } from "../utils";

/** Where readers can find the author elsewhere. */
export default function SocialLinksSection({ socialLinks, onChange }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-base font-bold text-foreground">
        Social links
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_FIELDS.map((social) => (
          <FormField key={social.key} label={social.label}>
            <input
              value={socialLinks[social.key] || ""}
              onChange={(e) => onChange(social.key, e.target.value)}
              placeholder={`Enter ${social.label} link`}
              className={inputCls}
            />
          </FormField>
        ))}
      </div>
    </section>
  );
}
