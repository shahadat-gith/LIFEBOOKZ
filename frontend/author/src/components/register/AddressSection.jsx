import Input from "../ui/Input";
import { Icons } from "../../icons";

export default function AddressSection({ form, errors, onChange }) {
  
  const handleAddressChange = (field, value) => {
    onChange("address", {
      ...form.address,
      [field]: value,
    });
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-muted/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icons.globe className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Address</h2>
          <p className="text-xs text-muted-foreground">
            Your location helps readers discover local stories
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="p-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Country *"
            value={form.address?.country || ""}
            error={errors["address.country"]}
            placeholder="Enter your country"
            onChange={(e) => handleAddressChange("country", e.target.value)}
          />
          <Input
            label="State *"
            value={form.address?.state || ""}
            error={errors["address.state"]}
            placeholder="Enter state or region"
            onChange={(e) => handleAddressChange("state", e.target.value)}
          />
          <Input
            label="City *"
            value={form.address?.city || ""}
            error={errors["address.city"]}
            placeholder="Enter city"
            onChange={(e) => handleAddressChange("city", e.target.value)}
          />
          <Input
            label="Zip Code"
            value={form.address?.zipCode || ""}
            placeholder="Enter postal / zip code"
            onChange={(e) => handleAddressChange("zipCode", e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}