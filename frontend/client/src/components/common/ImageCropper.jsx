import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import { Icons } from "../../icons";

/** Render the cropped region to a canvas and export it as a JPEG blob. */
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
 * Cropping dialog for avatars and cover images — drag to position, zoom to
 * fit, so the uploaded file is already framed exactly as it will render.
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
      onCropped(blob, URL.createObjectURL(blob));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:items-center sm:p-6">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full overflow-hidden rounded-t-3xl border border-border bg-card shadow-lg sm:max-w-xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        </div>

        <div className="relative h-72 bg-muted sm:h-80">
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

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Icons.zoomOut className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1"
            />
            <Icons.zoomIn className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Drag to reposition, use the slider to zoom.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={saving || !cropPixels}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Cropping…" : "Apply crop"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
