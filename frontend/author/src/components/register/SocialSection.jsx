import Input from "../ui/Input";
import { Icons } from "../../icons";

export default function SocialSection({ form, onChange }) {
  const handleSocialChange = (field, value) => {
    onChange("socialLinks", {
      ...form.socialLinks,
      [field]: value,
    });
  };

  const socialFields = [
    {
      label: "Website",
      field: "website",
      placeholder: "Enter website URL",
      icon: Icons.link,
      colSpan: "sm:col-span-2",
    },
    {
      label: "X (Twitter)",
      field: "x",
      placeholder: "Enter handle or URL",
      icon: Icons.twitter,
    },
    {
      label: "Instagram",
      field: "instagram",
      placeholder: "Enter handle or URL",
      icon: Icons.instagram,
    },
    {
      label: "LinkedIn",
      field: "linkedin",
      placeholder: "Enter profile URL",
      icon: Icons.linkedin,
    },
    {
      label: "Facebook",
      field: "facebook",
      placeholder: "Enter profile URL",
      icon: Icons.facebook,
    },
    {
      label: "YouTube",
      field: "youtube",
      placeholder: "Enter channel URL",
      icon: Icons.youtube,
    },
  ];

  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-muted/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icons.link className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Social Links</h2>
          <p className="text-xs text-muted-foreground">
            Connect with your audience beyond Lifebookz
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {socialFields.map((sf) => (
            <div key={sf.field} className={sf.colSpan || ""}>
              <Input
                label={sf.label}
                placeholder={sf.placeholder}
                value={form.socialLinks?.[sf.field] || ""}
                icon={<sf.icon className="h-4 w-4" />}
                onChange={(e) => handleSocialChange(sf.field, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}