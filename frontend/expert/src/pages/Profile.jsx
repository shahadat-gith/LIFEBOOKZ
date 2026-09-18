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
import ImageCropper from "../components/common/ImageCropper";
import { Icons } from "../icons";

/** Cover variants — wide banner for desktops, tighter crop for phones. */
const COVER_VARIANTS = [
  {
    key: "desktop",
    field: "coverImage",
    label: "Desktop cover",
    ratio: "16:5",
    aspect: 16 / 5,
    icon: Icons.desktop,
    hint: "Wide banner shown on laptops and desktops",
  },
  {
    key: "mobile",
    field: "coverImageMobile",
    label: "Mobile cover",
    ratio: "4:3",
    aspect: 4 / 3,
    icon: Icons.mobile,
    hint: "Taller crop shown on phones",
  },
];

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
  const [avatarPreview, setAvatarPreview] = useState(expert?.avatar?.url || null);
  const [covers, setCovers] = useState({ desktop: null, mobile: null });
  const [coverPreviews, setCoverPreviews] = useState({
    desktop: expert?.coverImage?.url || null,
    mobile: expert?.coverImageMobile?.url || null,
  });
  // Pending crop: { kind: 'avatar' | 'desktop' | 'mobile', src }
  const [cropping, setCropping] = useState(null);
  const [saving, setSaving] = useState(false);

  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

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

  /** Pick a file and open the cropper for that slot. */
  const handleFilePicked = (kind, e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Images must be 15 MB or smaller.");
      return;
    }

    setCropping({ kind, src: URL.createObjectURL(file) });
  };

  /** A cropped blob is ready — park it until save. */
  const handleCropped = (blob, previewUrl) => {
    const kind = cropping?.kind;
    if (cropping?.src?.startsWith("blob:")) URL.revokeObjectURL(cropping.src);

    if (kind === "avatar") {
      if (avatarPreview?.startsWith?.("blob:")) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(blob);
      setAvatarPreview(previewUrl);
    } else if (kind === "desktop" || kind === "mobile") {
      if (coverPreviews[kind]?.startsWith?.("blob:")) {
        URL.revokeObjectURL(coverPreviews[kind]);
      }
      setCovers((prev) => ({ ...prev, [kind]: blob }));
      setCoverPreviews((prev) => ({ ...prev, [kind]: previewUrl }));
    }

    setCropping(null);
  };

  const cancelCrop = () => {
    if (cropping?.src?.startsWith("blob:")) URL.revokeObjectURL(cropping.src);
    setCropping(null);
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
      if (avatarFile) fd.append("avatar", avatarFile, "avatar.jpg");
      if (covers.desktop) {
        fd.append("coverImage", covers.desktop, "cover-desktop.jpg");
      }
      if (covers.mobile) {
        fd.append("coverImageMobile", covers.mobile, "cover-mobile.jpg");
      }

      await updateProfile(fd);

      toast.success("Profile updated.");
      setAvatarFile(null);
      setCovers({ desktop: null, mobile: null });
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
      {/* Header — responsive cover (mobile crop on phones, desktop crop on
          larger screens) with the avatar overlapping it */}
      <div className="rounded-3xl border overflow-hidden bg-card">
        <div className="relative h-32 sm:h-48 bg-gradient-to-br from-primary/20 to-accent/20">
          {coverPreviews.desktop || coverPreviews.mobile ? (
            <picture>
              {coverPreviews.mobile && (
                <source
                  media="(max-width: 639px)"
                  srcSet={coverPreviews.mobile}
                />
              )}
              {coverPreviews.desktop && (
                <img
                  src={coverPreviews.desktop}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </picture>
          ) : (
            <button
              type="button"
              onClick={() => desktopRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icons.photo className="h-6 w-6" />
              <span className="text-xs mt-1">Add a cover image</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 px-8 pb-8 -mt-12 sm:-mt-14">
          <div className="relative group flex-shrink-0">
            <Avatar
              src={avatarPreview || expert.avatar?.url}
              name={expert.fullName}
              size="xl"
              className="ring-4 ring-card w-24 h-24"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Change profile photo"
            >
              <Icons.camera className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="text-center sm:text-left flex-1">
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
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs font-medium text-primary hover:underline"
          >
            {avatarPreview ? "Change photo" : "Upload photo"}
          </button>
        </div>

        {/* Cover controls — both variants are cropped before upload */}
        <div className="grid sm:grid-cols-2 gap-4 px-8 pb-8">
          {COVER_VARIANTS.map((v) => {
            const preview = coverPreviews[v.key];
            const Icon = v.icon;
            return (
              <div key={v.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {v.label}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({v.ratio})
                    </span>
                  </span>
                  {preview && (
                    <button
                      type="button"
                      onClick={() => {
                        setCovers((prev) => ({ ...prev, [v.key]: null }));
                        setCoverPreviews((prev) => ({ ...prev, [v.key]: null }));
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    (v.key === "desktop" ? desktopRef : mobileRef).current?.click()
                  }
                  className="relative w-full rounded-xl border border-dashed border-border hover:border-primary/50 overflow-hidden bg-muted/40 transition-colors"
                  style={{ aspectRatio: `${v.aspect}` }}
                >
                  {preview ? (
                    <>
                      <img
                        src={preview}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <span className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                        <Icons.edit className="h-3.5 w-3.5 mr-1.5" /> Reposition
                      </span>
                    </>
                  ) : (
                    <span className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Icons.upload className="h-5 w-5" />
                      <span className="text-xs mt-1">Choose image</span>
                    </span>
                  )}
                </button>
                <p className="mt-1 text-[11px] text-muted-foreground">{v.hint}</p>
              </div>
            );
          })}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFilePicked("avatar", e)}
          className="hidden"
        />
        <input
          ref={desktopRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFilePicked("desktop", e)}
          className="hidden"
        />
        <input
          ref={mobileRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFilePicked("mobile", e)}
          className="hidden"
        />
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
              placeholder="Enter your area of expertise"
              icon={<Icons.academic className="h-4 w-4" />}
              required
            />

            <Input
              label="Qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="Enter your qualification"
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
                placeholder="Enter languages you speak"
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
              placeholder="Describe how you help people"
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

      {/* Crop dialog — avatar (1:1, circular) or either cover variant */}
      {cropping && (
        <ImageCropper
          imageSrc={cropping.src}
          aspect={
            cropping.kind === "avatar"
              ? 1
              : cropping.kind === "desktop"
                ? 16 / 5
                : 4 / 3
          }
          circular={cropping.kind === "avatar"}
          title={
            cropping.kind === "avatar"
              ? "Crop your profile photo"
              : cropping.kind === "desktop"
                ? "Crop your desktop cover"
                : "Crop your mobile cover"
          }
          hint={
            cropping.kind === "avatar"
              ? "This is how your photo appears in the circular avatar."
              : cropping.kind === "desktop"
                ? "Shown on laptops and desktops."
                : "Shown on phones."
          }
          onCropped={handleCropped}
          onCancel={cancelCrop}
        />
      )}
    </motion.div>
  );
}
