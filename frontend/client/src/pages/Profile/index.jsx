import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import ImageCropper from "./components/ImageCropper";
import IdentityCard from "./components/IdentityCard";
import CoverImagesSection from "./components/CoverImagesSection";
import ProfileImageInputs from "./components/ProfileImageInputs";
import ProfileStats from "./components/ProfileStats";
import PersonalDetailsForm from "./components/PersonalDetailsForm";
import QuickLinks from "./components/QuickLinks";
import {
  ProfileHeading,
  ProfileLoading,
  SignedOutNotice,
} from "./components/ProfileStates";
import useProfileImages from "./hooks/useProfileImages";
import useBookingActivity from "./hooks/useBookingActivity";
import { buildProfileFormData } from "./utils";

/**
 * The member's own profile: how they appear, and what they have booked.
 *
 * The page only owns the name field, the save state and the composition —
 * the images and their cropping live in `useProfileImages`, the booking
 * summary in `useBookingActivity`, and each block is its own component.
 */
export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);

  const images = useProfileImages(user);
  const { activity, failed, reload } = useBookingActivity(
    !authLoading && isAuthenticated,
  );

  const avatarInputRef = useRef(null);
  const coverInputRefs = {
    desktop: useRef(null),
    mobile: useRef(null),
  };

  /* ---------- Seed the form from the loaded session ---------- */
  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
  }, [user]);

  const isDirty = useMemo(
    () =>
      images.isDirty ||
      (fullName || "").trim() !== (user?.fullName || "").trim(),
    [images.isDirty, fullName, user?.fullName],
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
      await updateUser(
        buildProfileFormData({
          fullName: cleanName,
          avatarFile: images.avatarFile,
          covers: images.covers,
        }),
      );

      images.commitImages();
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
    images.discardAvatar();
    setFieldError("");
  };

  if (authLoading) return <ProfileLoading />;
  if (!isAuthenticated) return <SignedOutNotice />;

  return (
    <div className="min-h-screen bg-background px-4 py-10 font-sans text-foreground selection:bg-accent/20 md:py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <ProfileHeading />

        <IdentityCard
          user={user}
          avatarSrc={images.avatarSrc}
          coverPreviews={images.coverPreviews}
          avatarInputRef={avatarInputRef}
          coverInputRefs={coverInputRefs}
        />

        <CoverImagesSection
          coverPreviews={images.coverPreviews}
          coverInputRefs={coverInputRefs}
          onRemove={images.removeCover}
        />

        <ProfileStats
          user={user}
          activity={activity}
          failed={failed}
          onRetry={reload}
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <PersonalDetailsForm
              email={user?.email}
              fullName={fullName}
              onNameChange={setFullName}
              fieldError={fieldError}
              onClearError={() => setFieldError("")}
              avatarFile={images.avatarFile}
              onChooseAvatar={() => avatarInputRef.current?.click()}
              onDiscardAvatar={images.discardAvatar}
              isDirty={isDirty}
              saving={saving}
              onSubmit={handleSubmit}
              onDiscard={handleDiscard}
            />
          </section>

          <QuickLinks />
        </div>
      </div>

      {/* One input per slot, opened by the buttons above */}
      <ProfileImageInputs
        accept={images.accept}
        onPick={images.pickImage}
        inputs={{ avatar: avatarInputRef, ...coverInputRefs }}
      />

      {/* Crop dialog — avatar (1:1, circular) or either cover variant */}
      {images.cropping && (
        <ImageCropper
          imageSrc={images.cropping.src}
          aspect={images.cropConfig.aspect}
          circular={images.cropConfig.circular}
          title={images.cropConfig.title}
          hint={images.cropConfig.hint}
          onCropped={images.handleCropped}
          onCancel={images.cancelCrop}
        />
      )}
    </div>
  );
}
