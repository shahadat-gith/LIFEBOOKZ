import FormField from "./FormField";
import { GENDERS, inputCls } from "../utils";

/** Profession, phone, date of birth, gender and bio — the publishing fields. */
export default function AboutSection({ form, onChange }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-base font-bold text-foreground">About you</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Profession" required>
          <input
            value={form.profession}
            onChange={(e) => onChange("profession", e.target.value)}
            placeholder="Enter profession"
            className={inputCls}
          />
        </FormField>

        <FormField label="Phone" required>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="Enter phone number"
            className={inputCls}
          />
        </FormField>

        <FormField label="Date of birth" required>
          <input
            type="date"
            value={form.dob}
            onChange={(e) => onChange("dob", e.target.value)}
            className={inputCls}
          />
        </FormField>

        <FormField label="Gender" required>
          <select
            value={form.gender}
            onChange={(e) => onChange("gender", e.target.value)}
            className={inputCls}
          >
            <option value="">Select gender</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Bio" required>
        <textarea
          value={form.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Write a short bio about yourself"
          className={`${inputCls} resize-y`}
        />
        <p className="mt-1 text-xs text-muted-foreground">{form.bio.length}/2000</p>
      </FormField>
    </section>
  );
}
