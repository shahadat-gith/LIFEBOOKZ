import { useState, useRef, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Textarea from "../../../components/ui/Textarea";
import Button from "../../../components/ui/Button";
import Card, { CardTitle } from "../../../components/ui/Card";
import { Icons } from "../../../icons";
import { uploadApi } from "../../../services/apis/upload";
import toast from "react-hot-toast";

const GOV_ID_OPTIONS = [
  { value: "passport", label: "Passport" },
  { value: "driving-license", label: "Driving License" },
  { value: "aadhar-card", label: "Aadhaar Card" },
  { value: "pan-card", label: "PAN Card" },
];



export function AuthorRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { registerAuthor } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    bio: "",
    website: "",
    x: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "",
    phoneNumber: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressCountry: "",
    addressZip: "",
    govIdType: "",
    govIdNumber: "",
  });

  const [govIdDocument, setGovIdDocument] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!form.fullName.trim()) errors.fullName = "Full Name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    if (!form.password.trim()) errors.password = "Password is required";
    else if (form.password.length < 8) errors.password = "Min. 8 characters";
    if (!form.bio.trim()) errors.bio = "Bio is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setError("");
    setLoading(true);

    try {
      let documentUrl = "";
      if (govIdDocument) {
        const uploadRes = await uploadApi.uploadDocument(govIdDocument);
        documentUrl = uploadRes.data.url;
      }

      await registerAuthor({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        bio: form.bio,
        website: form.website,
        socialLinks: {
          x: form.x,
          linkedin: form.linkedin,
          instagram: form.instagram,
        },
        kyc: {
          dateOfBirth: form.dateOfBirth || undefined,
          phoneNumber: form.phoneNumber,
          address: {
            street: form.addressStreet,
            city: form.addressCity,
            state: form.addressState,
            country: form.addressCountry,
            zipCode: form.addressZip,
          },
          governmentId: form.govIdType
            ? { type: form.govIdType, number: form.govIdNumber, documentUrl }
            : undefined,
        },
      });
      toast.success(
        "Application submitted! You will be notified once approved.",
      );
      navigate("/author/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 backdrop-blur-xl bg-card/90 border-border/50 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex justify-center mb-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/25">
                <Icons.edit className="h-7 w-7 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Become an Author
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Share your stories with the world — fill in your details below
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2 border border-destructive/20"
            >
              <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10"
            >
              {/* Left Column: Account & Profile */}
              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Account Details
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="Enter full name"
                      required
                      error={fieldErrors.fullName}
                      icon={<Icons.user className="h-4 w-4" />}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="Enter a valid email"
                      required
                      error={fieldErrors.email}
                      icon={<Icons.mail className="h-4 w-4" />}
                    />
                    <Input
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      error={fieldErrors.password}
                      icon={<Icons.lock className="h-4 w-4" />}
                      showPasswordToggle
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Profile Info
                  </h3>
                  <div className="space-y-4">
                    <Textarea
                      label="Bio"
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      placeholder="Share your writing journey, inspirations..."
                      rows={3}
                      required
                      error={fieldErrors.bio}
                    />
                    <Input
                      label="Website"
                      type="url"
                      value={form.website}
                      onChange={(e) => update("website", e.target.value)}
                      placeholder="https://yourblog.com"
                      icon={<Icons.link className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Identity Verification & Socials */}
              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Identity Verification
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => update("dateOfBirth", e.target.value)}
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        value={form.phoneNumber}
                        onChange={(e) => update("phoneNumber", e.target.value)}
                        placeholder="Phone Number"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Street"
                        value={form.addressStreet}
                        onChange={(e) =>
                          update("addressStreet", e.target.value)
                        }
                        placeholder="Street Address"
                      />
                      <Input
                        label="City"
                        value={form.addressCity}
                        onChange={(e) => update("addressCity", e.target.value)}
                        placeholder="City"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="State"
                        value={form.addressState}
                        onChange={(e) => update("addressState", e.target.value)}
                        placeholder="State"
                      />
                      <Input
                        label="Country"
                        value={form.addressCountry}
                        onChange={(e) =>
                          update("addressCountry", e.target.value)
                        }
                        placeholder="India"
                      />
                      <Input
                        label="ZIP"
                        value={form.addressZip}
                        onChange={(e) => update("addressZip", e.target.value)}
                        placeholder="PIN Code"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="ID Type"
                        value={form.govIdType}
                        onChange={(e) => update("govIdType", e.target.value)}
                        options={GOV_ID_OPTIONS}
                        placeholder="Select ID Type"
                      />
                      <Input
                        label="ID Number"
                        value={form.govIdNumber}
                        onChange={(e) => update("govIdNumber", e.target.value)}
                        placeholder="ID Number"
                      />
                    </div>

                    {/* Document Upload */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Upload ID Document (PDF)
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-input rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) =>
                            setGovIdDocument(e.target.files?.[0] || null)
                          }
                          className="hidden"
                        />
                        {govIdDocument ? (
                          <div className="flex items-center justify-center gap-2">
                            <Icons.document className="h-5 w-5 text-primary" />
                            <span className="text-sm text-foreground font-medium truncate max-w-[200px]">
                              {govIdDocument.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGovIdDocument(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Icons.close className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Icons.documentAdd className="h-6 w-6 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              Click to upload Aadhaar, PAN, Voter ID, or
                              Passport
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Social Media Row */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Social Links
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      placeholder="X (Twitter)"
                      value={form.x}
                      onChange={(e) => update("x", e.target.value)}
                      icon={<Icons.twitter className="h-4 w-4" />}
                    />
                    <Input
                      placeholder="Instagram"
                      value={form.instagram}
                      onChange={(e) => update("instagram", e.target.value)}
                      icon={<Icons.instagram className="h-4 w-4" />}
                    />
                    <Input
                      placeholder="LinkedIn"
                      value={form.linkedin}
                      onChange={(e) => update("linkedin", e.target.value)}
                      icon={<Icons.linkedin className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Actions Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-between mt-10 pt-6 border-t border-border gap-4"
            >
              <div className="flex items-center gap-4">

                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Already an author? Sign in
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                icon={<Icons.edit className="h-4 w-4" />}
                className="w-full sm:w-auto bg-gradient-to-r from-secondary to-accent hover:brightness-110 shadow-lg shadow-secondary/25"
              >
                Submit Application
              </Button>
            </motion.div>
          </form>

         
        </Card>
      </motion.div>
    </div>
  );
}

export default AuthorRegisterPage;
