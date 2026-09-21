import FormField from "./FormField";
import { inputCls } from "../utils";

const FIELDS = [
  { key: "country", label: "Country", placeholder: "Enter country" },
  { key: "state", label: "State", placeholder: "Enter state" },
  { key: "city", label: "City", placeholder: "Enter city" },
  { key: "zipCode", label: "Zip code", placeholder: "Enter zip code" },
];

/** Where the author lives — optional, but part of a complete profile. */
export default function AddressSection({ address, onChange }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-base font-bold text-foreground">Address</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <FormField key={field.key} label={field.label}>
            <input
              value={address[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={inputCls}
            />
          </FormField>
        ))}
      </div>
    </section>
  );
}
