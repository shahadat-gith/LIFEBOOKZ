import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import ImageCropper from "../../components/common/ImageCropper";
import LoadingScreen from "../../components/common/LoadingScreen";
import { apiErrorMessage } from "../../utils/helpers";
import { Icons } from "../../icons";

import ProfileImagesSection, {
  ProfileImageInputs,
} from "./components/ProfileImagesSection";
import AboutSection from "./components/AboutSection";
import AddressSection from "./components/AddressSection";
import SocialLinksSection from "./components/SocialLinksSection";
import {
  CROP_SPECS,
  emptyProfileForm,
  missingRequiredFields,
  profileForm,
  profileFormData,
} from "./utils";

/**
 * Edit — or complete — the author's profile.
 *
 * It is a full page rather than a dialog because cropping needs the room.
 * Two entry points matter: a plain edit, and `?complete=1` when the author
 * was sent here to finish their profile before publishing, which returns
 * them to `?redirect=` afterwards.
 */
export default function ProfileEditPage() {
  const { author, isLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const completeMode = Boolean(searchParams.get("complete"));
  const redirectTarget = searchParams.get("redirect");
  const returnTo =
    redirectTarget?.startsWith("/") ? redirectTarget : "/profile";

  const [form, setForm] = useState(emptyProfileForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null); // 'avatar' | 'cover'

  // Image state: the stored session images (uploads refresh the session)
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Pending crop: { kind: 'avatar' | 'cover', src }
  const [cropping, setCropping] = useState(null);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  /* ---------- Hydrate from the current author ---------- */
  useEffect(() => {
    if (!author) return;

    setForm(profileForm(author));
    setAvatarPreview(author.avatar?.url || null);
    setCoverPreview(author.coverImage?.url || null);
  }, [author]);

  // Revoke the object URLs we created for previews when leaving the page
  useEffect(
    () => () => {
      if (avatarPreview?.startsWith?.("blob:")) URL.revokeObjectURL(avatarPreview);
      if (coverPreview?.startsWith?.("blob:")) URL.revokeObjectURL(coverPreview);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );


  if (isLoading) return <LoadingScreen message="Loading profile…" />;
  if (!author) {
    navigate("/login");
    return null;
  }

  /* ---------- Field updates ---------- */

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateAddress = (key, value) =>
    setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));

  const updateSocial = (key, value) =>
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));

  /* ---------- Cropping ---------- */

  function releasePreview(url) {
    if (url?.startsWith?.("blob:")) URL.revokeObjectURL(url);
  }

  /**
   * A crop finished — images upload immediately, no Save needed. The
   * preview comes from the refreshed author session once the upload lands.
   */
  async function handleCropped(blob) {
    const kind = cropping?.kind;
    releasePreview(cropping?.src);
    setCropping(null);
    if (!kind) return;

    setUploading(kind);

    try {
      await updateProfile(
        profileFormData({},
          kind === "avatar" ? { avatar: blob } : { cover: blob },
        ),
      );

      if (kind === "avatar") {
        releasePreview(avatarPreview);
        setAvatarBlob(null);
      } else {
        releasePreview(coverPreview);
        setCoverBlob(null);
      }

      toast.success(
        kind === "avatar" ? "Profile photo updated" : "Cover image updated",
      );
    } catch (err) {
      toast.error(
        apiErrorMessage(err, "We couldn't save your image. Please try again."),
      );
    } finally {
      setUploading(null);
    }
  }

  /* ---------- Save ---------- */

  async function handleSubmit(event) {
    event.preventDefault();

    // Completing a profile needs the publishing-critical fields filled in.
    if (completeMode) {
      const missing = missingRequiredFields(form);
      if (missing.length > 0) {
        toast.error(`Please fill in: ${missing.join(", ")}.`);
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile(profileFormData(form));

      toast.success(
        author.isProfileCompleted
          ? "Profile updated"
          : "Profile completed — you can now publish stories",
      );

      navigate(returnTo);
    } catch (err) {
      toast.error(
        apiErrorMessage(
          err,
          Object.values(err?.response?.data?.error?.fields || {})[0] ||
            "Failed to update profile",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Render ---------- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6"
    >
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => (redirectTarget?.startsWith("/") ? navigate(returnTo) : navigate(-1))}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icons.arrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="mt-3 font-display text-2xl font-bold text-foreground sm:text-3xl">
          {completeMode ? "Complete your profile" : "Edit profile"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {completeMode
            ? "A complete profile is required before you can publish stories. Your draft is saved."
            : "Keep your profile up to date — it appears on everything you publish."}
        </p>

        {completeMode && !author.isProfileCompleted && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
            <Icons.infoCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
            <p className="text-xs text-foreground">
              Fill in profession, bio, phone, date of birth and gender to unlock
              publishing.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ProfileImagesSection
          author={author}
          avatarPreview={avatarPreview}
          coverPreview={coverPreview}
          uploading={uploading}
          onFileChosen={(kind) =>
            (kind === "avatar" ? avatarInputRef : coverInputRef).current?.click()
          }
        />

        <ProfileImageInputs
          onPick={{
            avatarRef: avatarInputRef,
            coverRef: coverInputRef,
            avatar: (file) =>
              setCropping({ kind: "avatar", src: URL.createObjectURL(file) }),
            cover: (file) =>
              setCropping({ kind: "cover", src: URL.createObjectURL(file) }),
          }}
        />

        <AboutSection form={form} onChange={update} />
        <AddressSection address={form.address} onChange={updateAddress} />
        <SocialLinksSection socialLinks={form.socialLinks} onChange={updateSocial} />

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/profile"
            className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
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

      {/* Crop dialog */}
      {cropping && (
        <ImageCropper
          imageSrc={cropping.src}
          {...CROP_SPECS[cropping.kind]}
          onCropped={handleCropped}
          onCancel={() => {
            releasePreview(cropping.src);
            setCropping(null);
          }}
        />
      )}
    </motion.div>
  );
}
