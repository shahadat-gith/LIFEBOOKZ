import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { CONSULT_CATEGORIES } from "../config";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Avatar from "../components/ui/Avatar";
import Card, { CardTitle, CardContent, CardFooter } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Icons } from "../icons";

export default function Profile() {
  const { expert, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [fullName, setFullName] = useState(expert?.fullName || "");
  const [expertise, setExpertise] = useState(expert?.expertise || "");
  const [qualification, setQualification] = useState(expert?.qualification || "");
  const [bio, setBio] = useState(expert?.bio || "");
  const [phone, setPhone] = useState(expert?.phone || "");
  const [experience, setExperience] = useState(expert?.experience ?? 0);
  const [price, setPrice] = useState(expert?.price ?? 0);
  const [languages, setLanguages] = useState((expert?.languages || []).join(", "));
  const [categories, setCategories] = useState(expert?.categories || []);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!expert) {
      navigate("/login");
    }
  }, [expert, navigate]);

  if (!expert) return null;

  const isApproved = expert.verification?.status === "approved";

  const toggleCategory = (id) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (categories.length === 0) {
      toast.error("Keep at least one consultancy category selected.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fullName", fullName);
      fd.append("expertise", expertise);
      fd.append("qualification", qualification);
      fd.append("bio", bio);
      fd.append("phone", phone);
      fd.append("experience", String(Math.max(0, Number(experience) || 0)));
      fd.append("price", String(Math.max(0, Number(price) || 0)));
      fd.append(
        "languages",
        JSON.stringify(
          languages
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
        ),
      );
      fd.append("categories", JSON.stringify(categories));
      if (avatarFile) fd.append("avatar", avatarFile);

      await updateProfile(fd);

      toast.success("Profile updated — your matching profile was refreshed.");
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message || "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto py-10 px-4 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-8 rounded-3xl border bg-gradient-to-br from-card to-muted/30">
        <div className="relative group flex-shrink-0">
          <Avatar
            src={avatarPreview || expert.avatar?.url}
            name={expert.fullName}
            size="xl"
            className="ring-4 ring-primary/10 w-20 h-20"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Icons.camera className="h-6 w-6 text-white" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-foreground">
            {expert.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">{expert.email}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Badge variant={isApproved ? "success" : "warning"}>
              {isApproved ? "Verified Expert" : "Pending Approval"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              &bull; {expert.expertise}
            </span>
          </div>
          {avatarFile && (
            <p className="text-xs text-primary mt-2">
              New image selected: {avatarFile.name}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <CardTitle>Expert Profile</CardTitle>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                icon={<Icons.user className="h-4 w-4" />}
              />
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Icons.phone className="h-4 w-4" />}
              />
            </div>

            <Input
              label="Email"
              value={expert.email}
              disabled
              helperText="Email cannot be changed"
            />

            <Input
              label="Area of expertise"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="e.g. Academic counselling & study skills"
              icon={<Icons.academic className="h-4 w-4" />}
              required
            />

            <Input
              label="Qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g. M.A. Psychology, Certified Career Coach"
              icon={<Icons.shieldCheck className="h-4 w-4" />}
              required
            />

            <div className="grid gap-5 sm:grid-cols-3">
              <Input
                label="Years of experience"
                type="number"
                min="0"
                max="60"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                icon={<Icons.clock className="h-4 w-4" />}
              />
              <Input
                label="Session price (USD)"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                icon={<Icons.money className="h-4 w-4" />}
              />
              <Input
                label="Languages"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="English, Hindi"
                icon={<Icons.globe className="h-4 w-4" />}
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Consultancy categories
              </label>
              <p className="mb-3 text-xs text-muted-foreground">
                Saving regenerates your matching profile so you keep appearing
                in the right searches.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CONSULT_CATEGORIES.map((cat) => {
                  const checked = categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                        checked
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                          checked
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border"
                        }`}
                      >
                        {checked && <Icons.check className="h-3 w-3" />}
                      </span>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              placeholder="Tell people how you help..."
            />
          </CardContent>

          <CardFooter className="px-6 py-4 border-t border-border flex flex-wrap gap-3 justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              icon={<Icons.logout className="h-4 w-4" />}
            >
              Sign Out
            </Button>
            <Button
              type="submit"
              loading={saving}
              icon={<Icons.save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </motion.div>
  );
}
