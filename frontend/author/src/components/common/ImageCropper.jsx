import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import { Icons } from "../../icons";

/**
 * Render the cropped region to a canvas and export it as a JPEG blob.
 * Drawing at 2× the natural crop size keeps the result crisp.
 */
async function cropToBlob(imageSrc, cropPixels, { maxWidth = 2000 } = {}) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const scale = cropPixels.width > maxWidth ? maxWidth / cropPixels.width : 1;
  const width = Math.round(cropPixels.width * scale);
  const height = Math.round(cropPixels.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    width,
    height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

/**
 * Cropping dialog for avatars and cover images.
 *
 * Because the crop happens in the browser, the bytes that reach the server
 * are already framed correctly — an author can position exactly what shows
 * in the circle (avatar) or the banner (cover).
 *
 * @param {Object} props
 * @param {string} props.imageSrc      object URL of the picked file
 * @param {number} props.aspect        width / height of the crop frame
 * @param {boolean} [props.circular]   round avatar mask
 * @param {string} props.title         dialog heading
 * @param {string} [props.hint]        helper line under the heading
 * @param {(blob: Blob, previewUrl: string) => void} props.onCropped
 * @param {() => void} props.onCancel
 */
export default function ImageCropper({
  imageSrc,
  aspect = 1,
  circular = false,
  title = "Adjust image",
  hint = "",
  onCropped,
  onCancel,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCropPixels(areaPixels);
  }, []);

  async function handleApply() {
    if (!cropPixels) return;
    setSaving(true);
    try {
      const blob = await cropToBlob(imageSrc, cropPixels);
      const previewUrl = URL.createObjectURL(blob);
      onCropped(blob, previewUrl);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
            {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        </div>

        <div className="relative h-72 sm:h-80 bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={circular ? "round" : "rect"}
            showGrid={!circular}
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <Icons.zoomOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1 accent-[var(--primary)]"
            />
            <Icons.zoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Drag to reposition, use the slider to zoom.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={saving || !cropPixels}
              className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Cropping…" : "Apply crop"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
