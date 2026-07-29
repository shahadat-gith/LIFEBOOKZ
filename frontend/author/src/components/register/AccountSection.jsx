import Input from "../ui/Input";
import Select from "../ui/Select";
import { Icons } from "../../icons";
import { sanitizeUsername } from "../../utils/helpers";

export default function AccountSection({ form, errors, onChange }) {

  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-muted/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icons.user className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Personal Information</h2>
          <p className="text-xs text-muted-foreground">
            Your identity on Lifebookz
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="p-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Full Name *"
            value={form.fullName}
            error={errors.fullName}
            icon={<Icons.user className="h-4 w-4" />}
            placeholder="Enter your full name"
            onChange={(e) => onChange("fullName", e.target.value)}
          />
          <Input
            label="Username"
            value={form.username}
            placeholder="Choose a unique username"
            error={errors.username}
            icon={<Icons.atSymbol className="h-4 w-4" />}
            onChange={(e) =>
              onChange("username", sanitizeUsername(e.target.value))
            }
            helperText={
              form.username
                ? `lifebookz.com/@${form.username}`
                : "Letters, numbers, dots, hyphens, underscores"
            }
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Email *"
            type="email"
            value={form.email}
            error={errors.email}
            icon={<Icons.mail className="h-4 w-4" />}
            placeholder="Enter your email address"
            onChange={(e) => onChange("email", e.target.value)}
          />
          <Input
            label="Password *"
            type="password"
            showPasswordToggle
            value={form.password}
            error={errors.password}
            icon={<Icons.lock className="h-4 w-4" />}
            placeholder="Create password"
            onChange={(e) => onChange("password", e.target.value)}
          />
        </div>

        <p className="text-xs text-muted-foreground -mt-2">
          Use at least 8 characters with a mix of letters and numbers.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Phone Number *"
            type="tel"
            value={form.phone}
            placeholder="Enter phone number with country code"
            error={errors.phone}
            icon={<Icons.phone className="h-4 w-4" />}
            onChange={(e) => onChange("phone", e.target.value)}
          />
          <Input
            label="Profession *"
            value={form.profession}
            placeholder="Enter primary profession"
            error={errors.profession}
            icon={<Icons.edit className="h-4 w-4" />}
            onChange={(e) => onChange("profession", e.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Date of Birth *"
            type="date"
            value={form.dob}
            error={errors.dob}
            onChange={(e) => onChange("dob", e.target.value)}
          />
          <div className="sm:col-span-2">
            <Select
              label="Gender *"
              value={form.gender}
              error={errors.gender}
              onChange={(e) => onChange("gender", e.target.value)}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" },
              ]}
              placeholder="Select your gender"
            />
          </div>
        </div>
      </div>
    </section>
  );
}