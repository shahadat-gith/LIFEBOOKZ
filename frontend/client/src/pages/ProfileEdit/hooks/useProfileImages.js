import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, cropConfigFor } from "../utils";

/**
 * The profile's image slots — avatar and cover — as a crop flow.
 *
 * Picking a file opens the cropper; applying the crop hands the blob to the
 * page, which uploads it immediately (no separate save step). The stored
 * images come straight from the session user, so the card updates the
 * moment the upload succeeds.
 */
export default function useProfileImages() {
  // Pending crop: { kind: 'avatar' | 'cover', src }
  const [cropping, setCropping] = useState(null);

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

  /** Close the crop dialog, releasing its preview URL. */
  const cancelCrop = useCallback(() => {
    if (cropping?.src?.startsWith("blob:")) URL.revokeObjectURL(cropping.src);
    setCropping(null);
  }, [cropping]);

  const cropConfig = cropping ? cropConfigFor(cropping.kind) : null;

  return {
    accept: ACCEPTED_IMAGE_TYPES,
    cropping,
    cropConfig,
    pickImage,
    cancelCrop,
  };
}
