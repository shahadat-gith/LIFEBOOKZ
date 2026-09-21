import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { Icons } from "../icons";
import Avatar from "../components/ui/Avatar";
import ImageCropper from "../components/common/ImageCropper";
import LoadingScreen from "../components/common/LoadingScreen";

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all";

const SOCIAL_FIELDS = [
  { key: "website", label: "Website" },
  { key: "x", label: "X (Twitter)" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
];

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

function Field({ label, children, required, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function ProfileEditPage() {
  const { author, isLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?complete=1 → the author was sent here to finish their profile before
  // publishing. ?redirect=<path> is where to return once it saves.
  const completeMode = Boolean(searchParams.get("complete"));
  const redirectTarget = searchParams.get("redirect");

  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState({
    country: "",
    state: "",
    city: "",
    zipCode: "",
  });
  const [socialLinks, setSocialLinks] = useState({
    website: "",
    x: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    youtube: "",
  });

  // Image state: the cropped Blob we upload + its preview URL
  const [avatarBlob, setAvatarBlob] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [covers, setCovers] = useState({ desktop: null, mobile: null });
  const [coverPreviews, setCoverPreviews] = useState({
    desktop: null,
    mobile: null,
  });

  // Pending crop: { kind: 'avatar' | 'desktop' | 'mobile', src }
  const [cropping, setCropping] = useState(null);
  const [saving, setSaving] = useState(false);

  const avatarRef = useRef(null);
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  /* ---------- Hydrate from the current author ---------- */
  useEffect(() => {
    if (!author) return;
    setProfession(author.profession || "");
    setBio(author.bio || "");
    setPhone(author.phone || "");
    setDob(author.dob ? new Date(author.dob).toISOString().slice(0, 10) : "");
    setGender(author.gender || "");
    setAddress({
      country: author.address?.country || "",
      state: author.address?.state || "",
      city: author.address?.city || "",
      zipCode: author.address?.zipCode || "",
    });
    setSocialLinks({
      website: author.socialLinks?.website || "",
      x: author.socialLinks?.x || "",
      instagram: author.socialLinks?.instagram || "",
      facebook: author.socialLinks?.facebook || "",
      linkedin: author.socialLinks?.linkedin || "",
      youtube: author.socialLinks?.youtube || "",
    });
    setAvatarPreview(author.avatar?.url || null);
    setCoverPreviews({
      desktop: author.coverImage?.url || null,
      mobile: author.coverImageMobile?.url || null,
    });
  }, [author]);

  // Revoke object URLs we created for previews when leaving the page
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith?.("blob:")) URL.revokeObjectURL(avatarPreview);
      Object.values(coverPreviews).forEach((url) => {
        if (url?.startsWith?.("blob:")) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <LoadingScreen message="Loading profile…" />;
  if (!author) {
    navigate("/login");
    return null;
  }

  /* ---------- Cropping ---------- */

  function pickFile(kind) {
    if (kind === "avatar") avatarRef.current?.click();
    if (kind === "desktop") desktopRef.current?.click();
    if (kind === "mobile") mobileRef.current?.click();
  }

  function handleFilePicked(kind, e) {
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
  }

  function handleCropped(blob, previewUrl) {
    const kind = cropping?.kind;
    if (cropping?.src?.startsWith("blob:")) URL.revokeObjectURL(cropping.src);

    if (kind === "avatar") {
      if (avatarPreview?.startsWith?.("blob:")) URL.revokeObjectURL(avatarPreview);
      setAvatarBlob(blob);
      setAvatarPreview(previewUrl);
    } else if (kind === "desktop" || kind === "mobile") {
      if (coverPreviews[kind]?.startsWith?.("blob:")) {
        URL.revokeObjectURL(coverPreviews[kind]);
      }
      setCovers((prev) => ({ ...prev, [kind]: blob }));
      setCoverPreviews((prev) => ({ ...prev, [kind]: previewUrl }));
    }

    setCropping(null);
  }

  function cancelCrop() {
    if (cropping?.src?.startsWith("blob:")) URL.revokeObjectURL(cropping.src);
    setCropping(null);
  }

  /* ---------- Save ---------- */

  async function handleSubmit(e) {
    e.preventDefault();

    // Completion needs the publishing-critical fields filled in.
    const missing = [];
    if (!profession.trim()) missing.push("profession");
    if (!bio.trim()) missing.push("bio");
    if (!phone.trim()) missing.push("phone");
    if (!dob) missing.push("date of birth");
    if (!gender) missing.push("gender");

    if (completeMode && missing.length) {
      toast.error(`Please fill in: ${missing.join(", ")}.`);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("profession", profession);
      fd.append("bio", bio);
      fd.append("phone", phone);
      if (dob) fd.append("dob", dob);
      if (gender) fd.append("gender", gender);
      fd.append("address", JSON.stringify(address));
      fd.append("socialLinks", JSON.stringify(socialLinks));

      if (avatarBlob) fd.append("avatar", avatarBlob, "avatar.jpg");
      if (covers.desktop) {
        fd.append("coverImage", covers.desktop, "cover-desktop.jpg");
      }
      if (covers.mobile) {
        fd.append("coverImageMobile", covers.mobile, "cover-mobile.jpg");
      }

      await updateProfile(fd);

      toast.success(
        author.isProfileCompleted
          ? "Profile updated"
          : "Profile completed — you can now publish stories",
      );

      // ?redirect=<path> — resume whatever the author was doing (e.g. the
      // publish step they were bounced from).
      if (redirectTarget && redirectTarget.startsWith("/")) {
        navigate(redirectTarget);
      } else {
        navigate("/profile");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        Object.values(err?.response?.data?.error?.fields || {})[0] ||
        "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const setAddressField = (key) => (e) =>
    setAddress((a) => ({ ...a, [key]: e.target.value }));
  const setSocialField = (key) => (e) =>
    setSocialLinks((s) => ({ ...s, [key]: e.target.value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-28"
    >
      {/* ---------- Header ---------- */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() =>
            redirectTarget && redirectTarget.startsWith("/")
              ? navigate(redirectTarget)
              : navigate(-1)
          }
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icons.arrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-foreground">
          {completeMode ? "Complete your profile" : "Edit profile"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {completeMode
            ? "A complete profile is required before you can publish stories. Your draft is saved."
            : "Keep your profile up to date — it appears on everything you publish."}
        </p>

        {completeMode && !author.isProfileCompleted && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
            <Icons.infoCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground">
              Fill in profession, bio, phone, date of birth and gender to unlock
              publishing.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ---------- Images ---------- */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">
            Profile images
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Position each image exactly how it should appear.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar
                  src={avatarPreview}
                  name={author.fullName}
                  size="xl"
                  className="w-28 h-28 ring-4 ring-card"
                />
                <button
                  type="button"
                  onClick={() => pickFile("avatar")}
                  aria-label="Change profile photo"
                  className="absolute inset-0 rounded-full bg-black/45 opacity-0 hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity"
                >
                  <Icons.camera className="h-5 w-5" />
                  <span className="text-[10px] font-medium mt-0.5">Change</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => pickFile("avatar")}
                className="text-xs font-medium text-primary hover:underline"
              >
                {avatarPreview ? "Change photo" : "Upload photo"}
              </button>
              <p className="text-[11px] text-muted-foreground text-center max-w-[10rem]">
                Square crop, 1:1 — shown as a circle.
              </p>
            </div>

            {/* Covers */}
            <div className="flex-1 grid gap-4">
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
                      onClick={() => pickFile(v.key)}
                      className="relative w-full h-24 rounded-xl border border-dashed border-border hover:border-primary/50 overflow-hidden bg-muted/40 transition-colors"
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
                            <Icons.edit className="h-4 w-4 mr-1.5" /> Reposition
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
          </div>

          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFilePicked("avatar", e)}
          />
          <input
            ref={desktopRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFilePicked("desktop", e)}
          />
          <input
            ref={mobileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFilePicked("mobile", e)}
          />
        </section>

        {/* ---------- Essentials ---------- */}
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-foreground">
            About you
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Profession" required>
              <input
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Enter profession"
                className={inputCls}
              />
            </Field>
            <Field label="Phone" required>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className={inputCls}
              />
            </Field>
            <Field label="Date of birth" required>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Gender" required>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputCls}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
          </div>

          <Field label="Bio" required>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Write a short bio about yourself"
              className={`${inputCls} resize-y`}
            />
            <p className="mt-1 text-xs text-muted-foreground">{bio.length}/2000</p>
          </Field>
        </section>

        {/* ---------- Address ---------- */}
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-foreground">
            Address
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Country">
              <input
                value={address.country}
                onChange={setAddressField("country")}
                placeholder="Enter country"
                className={inputCls}
              />
            </Field>
            <Field label="State">
              <input
                value={address.state}
                onChange={setAddressField("state")}
                placeholder="Enter state"
                className={inputCls}
              />
            </Field>
            <Field label="City">
              <input
                value={address.city}
                onChange={setAddressField("city")}
                placeholder="Enter city"
                className={inputCls}
              />
            </Field>
            <Field label="Zip code">
              <input
                value={address.zipCode}
                onChange={setAddressField("zipCode")}
                placeholder="Enter zip code"
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        {/* ---------- Social links ---------- */}
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-foreground">
            Social links
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {SOCIAL_FIELDS.map((s) => (
              <Field key={s.key} label={s.label}>
                <input
                  value={socialLinks[s.key] || ""}
                  onChange={setSocialField(s.key)}
                  placeholder={`Enter ${s.label} link`}
                  className={inputCls}
                />
              </Field>
            ))}
          </div>
        </section>

        {/* ---------- Actions ---------- */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Link
            to="/profile"
            className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Icons.spinner className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : completeMode ? (
              "Complete profile"
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>

      {/* ---------- Crop dialog ---------- */}
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
