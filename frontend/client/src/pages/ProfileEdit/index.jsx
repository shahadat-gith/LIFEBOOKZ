import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";

import ImageCropper from "./components/ImageCropper";
import IdentityCard from "../Profile/components/IdentityCard";
import PersonalDetailsForm from "./components/PersonalDetailsForm";
import ProfileImageInputs from "./components/ProfileImageInputs";
import { ProfileLoading, SignedOutNotice } from "../Profile/components/ProfileStates";
import useProfileImages from "./hooks/useProfileImages";
import { buildProfileFormData } from "./utils";

/**
 * Editing the member's profile: the name saves through the form, while the
 * avatar and cover save the instant their crop is applied — no separate
 * save step for images. The read-only profile lives at `/profile`.
 */
export default function ProfileEdit() {
  const { user, isAuthenticated, isLoading: authLoading, updateUser } =
    useAuth();

  const [fullName, setFullName] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null); // 'avatar' | 'cover'

  const images = useProfileImages();

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  /* ---------- Seed the form from the loaded session ---------- */
  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
  }, [user]);

  const isDirty = useMemo(
    () => (fullName || "").trim() !== (user?.fullName || "").trim(),
    [fullName, user?.fullName],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanName = fullName.trim();

    if (cleanName.length < 2) {
      setFieldError("Full name must be at least 2 characters.");
      return;
    }

    setFieldError("");
    setSaving(true);

    try {
      await updateUser(buildProfileFormData({ fullName: cleanName }));
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "We couldn't save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setFullName(user?.fullName || "");
    setFieldError("");
  };

  /* ---------- Images: crop, then upload right away ---------- */
  const handleCropped = async (blob) => {
    const kind = images.cropping?.kind;
    images.cancelCrop();
    if (!kind) return;

    setUploading(kind);

    try {
      const payload =
        kind === "avatar"
          ? buildProfileFormData({ avatarFile: blob })
          : buildProfileFormData({ coverFile: blob });

      await updateUser(payload);
      toast.success(
        kind === "avatar" ? "Profile photo updated." : "Cover image updated.",
      );
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "We couldn't save your image. Please try again.",
      );
    } finally {
      setUploading(null);
    }
  };

  if (authLoading) return <ProfileLoading />;
  if (!isAuthenticated) return <SignedOutNotice />;

  return (
    <div className="min-h-screen bg-background px-4 py-10 font-sans text-foreground selection:bg-accent/20 md:py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Back to the read-only profile */}
        <button
          type="button"
          onClick={() => history.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icons.chevronLeft className="h-4 w-4" />
          Back to Profile
        </button>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
            Edit Profile
          </h1>
        </div>

        {/* The identity card, live — camera buttons open the pickers below.
            Images show the stored session values; uploads refresh the
            session, which updates the card the moment they finish. */}
        <IdentityCard
          user={user}
          avatarSrc={user?.avatar?.url}
          coverSrc={user?.coverImage?.url}
          avatarInputRef={avatarInputRef}
          coverInputRef={coverInputRef}
          editable
          uploading={uploading}
        />

        <PersonalDetailsForm
          email={user?.email}
          fullName={fullName}
          onNameChange={setFullName}
          fieldError={fieldError}
          onClearError={() => setFieldError("")}
          isDirty={isDirty}
          saving={saving}
          onSubmit={handleSubmit}
          onDiscard={handleDiscard}
        />

        {/* One input per slot, opened by the card's camera buttons */}
        <ProfileImageInputs
          accept={images.accept}
          onPick={images.pickImage}
          inputs={{ avatar: avatarInputRef, cover: coverInputRef }}
        />

        {/* Crop dialog — avatar (1:1, circular) or the 16:9 cover */}
        {images.cropping && (
          <ImageCropper
            imageSrc={images.cropping.src}
            aspect={images.cropConfig.aspect}
            circular={images.cropConfig.circular}
            title={images.cropConfig.title}
            hint={images.cropConfig.hint}
            onCropped={handleCropped}
            onCancel={images.cancelCrop}
          />
        )}
      </div>
    </div>
  );
}
