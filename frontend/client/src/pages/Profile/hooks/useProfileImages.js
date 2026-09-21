import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  cropConfigFor,
} from "../utils";

/**
 * The profile's three image slots — avatar, desktop cover, mobile cover.
 *
 * Picking a file opens the cropper; only the cropped result is kept, as a
 * blob plus an object URL for preview. Nothing is uploaded until the form is
 * saved, and every object URL this hook creates is revoked when it is
 * replaced or when the page unmounts.
 */
export default function useProfileImages(user) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [covers, setCovers] = useState({ desktop: null, mobile: null });
  const [coverPreviews, setCoverPreviews] = useState({
    desktop: "",
    mobile: "",
  });
  // Pending crop: { kind: 'avatar' | 'desktop' | 'mobile', src }
  const [cropping, setCropping] = useState(null);

  /* ---------- Show the stored covers until a new one is picked ---------- */
  useEffect(() => {
    if (!user) return;
    setCoverPreviews((prev) => ({
      desktop: prev.desktop || user.coverImage?.url || "",
      mobile: prev.mobile || user.coverImageMobile?.url || "",
    }));
  }, [user]);

  /* ---------- Never leak a preview URL ---------- */
  useEffect(
    () => () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const isDirty = useMemo(
    () => Boolean(avatarFile || covers.desktop || covers.mobile),
    [avatarFile, covers],
  );

  /** Pick a file for a slot, then let the person position the crop. */
  const pickImage = useCallback((kind, event) => {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file after a failed attempt
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    setCropping({ kind, src: URL.createObjectURL(file) });
  }, []);

  /** A crop finished — keep the blob until the form is saved. */
  const handleCropped = useCallback(
    (blob, objectUrl) => {
      const kind = cropping?.kind;
      if (cropping?.src?.startsWith("blob:")) URL.revokeObjectURL(cropping.src);

      if (kind === "avatar") {
        if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setAvatarFile(blob);
        setPreviewUrl(objectUrl);
      } else if (kind === "desktop" || kind === "mobile") {
        if (coverPreviews[kind]?.startsWith("blob:")) {
          URL.revokeObjectURL(coverPreviews[kind]);
        }
        setCovers((prev) => ({ ...prev, [kind]: blob }));
        setCoverPreviews((prev) => ({ ...prev, [kind]: objectUrl }));
      }

      setCropping(null);
    },
    [cropping, previewUrl, coverPreviews],
  );

  const cancelCrop = useCallback(() => {
    if (cropping?.src?.startsWith("blob:")) URL.revokeObjectURL(cropping.src);
    setCropping(null);
  }, [cropping]);

  /** Drop the avatar that is queued for upload, keeping the stored one. */
  const discardAvatar = useCallback(() => setAvatarFile(null), []);

  const removeCover = useCallback((kind) => {
    setCovers((prev) => ({ ...prev, [kind]: null }));
    setCoverPreviews((prev) => ({ ...prev, [kind]: "" }));
  }, []);

  /** The form was saved — nothing is pending any more. */
  const commitImages = useCallback(() => {
    setAvatarFile(null);
    setCovers({ desktop: null, mobile: null });
  }, []);

  const cropConfig = cropping ? cropConfigFor(cropping.kind) : null;
  const avatarSrc = previewUrl || user?.avatar?.url;

  return {
    accept: ACCEPTED_IMAGE_TYPES,
    avatarFile,
    avatarSrc,
    covers,
    coverPreviews,
    cropping,
    cropConfig,
    isDirty,
    pickImage,
    handleCropped,
    cancelCrop,
    discardAvatar,
    removeCover,
    commitImages,
  };
}
