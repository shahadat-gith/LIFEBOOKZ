import { useRef, useState } from "react";
import { Icons } from "../../icons";
import { WizardShell } from "./WizardShell";
import { PrimaryButton } from "./WizardShell";
import api from "../../config/api";
import toast from "react-hot-toast";

const TABS = [
  { key: "image", label: "Photos" },
  { key: "video", label: "Videos" },
];

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/heic",
  video: "video/mp4,video/quicktime,video/webm,video/x-matroska",
};

const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 500;

/**
 * Upload a file DIRECTLY to R2:
 *  1. Ask the API for a presigned PUT URL
 *  2. PUT the file straight to storage — it never passes through the API
 *  3. Return the `{ url, key, type }` descriptor stored on the story
 */
async function uploadViaPresign(file, onStage) {
  const contentType = file.type;
  const kind = contentType.startsWith("video/") ? "video" : "image";

  // 1. Presigned URL from the API
  onStage?.("Preparing upload…");
  const presignRes = await api.post("/stories/media/presign", {
    contentType,
    kind,
    size: file.size,
    filename: file.name,
  });
  const { uploadUrl, key, url, type } = presignRes.data.data;

  // 2. Direct upload to R2
  onStage?.(`Uploading ${file.name.slice(0, 24)}…`);
  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!put.ok) {
    throw new Error("Upload failed — please try again.");
  }

  // 3. R2 media descriptor (no Cloudinary publicId — just url + key)
  return { url, key, type, caption: "" };
}

export default function AddMediaStep({
  story,
  onChange,
  onContinue,
  onBack,
}) {
  const [tab, setTab] = useState("image");
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState("");
  const inputRef = useRef(null);

  const media = story.media || [];
  const byType = (t) => media.filter((m) => m.type === t);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const isVideo = file.type.startsWith("video/");
        const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
        if (file.size > maxMb * 1024 * 1024) {
          toast.error(`${file.name} is over ${maxMb} MB.`);
          continue;
        }
        uploaded.push(await uploadViaPresign(file, setStage));
      }
      if (uploaded.length > 0) {
        onChange({ ...story, media: [...media, ...uploaded] });
        toast.success(`${uploaded.length} file(s) added`);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || err?.message;
      toast.error(msg || "Failed to upload media");
    } finally {
      setUploading(false);
      setStage("");
    }
  }

  function removeMedia(idx) {
    const item = media[idx];
    // Best-effort cleanup of the R2 object
    if (item?.key) {
      api.delete("/stories/media", { data: { key: item.key } }).catch(() => {});
    }
    onChange({ ...story, media: media.filter((_, i) => i !== idx) });
  }

  const shown = byType(tab);

  return (
    <WizardShell step={5} totalSteps={9} title="Add Media" onBack={onBack}>
      <p className="text-center text-sm text-muted-foreground mb-5">
        Add photos and videos
        <br />
        to bring your story to life.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-border/60 mb-4">
        {TABS.map((t) => {
          const count = byType(t.key).length;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 pb-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {count > 0 && ` (${count})`}
            </button>
          );
        })}
      </div>

      {/* Tile grid */}
      {shown.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {media.map((m, idx) =>
            m.type !== tab ? null : (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden bg-muted"
              >
                {m.type === "image" ? (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={m.url} className="w-full h-full object-cover" muted />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  aria-label="Remove media"
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-card/90 text-foreground flex items-center justify-center shadow-sm hover:bg-card"
                >
                  <Icons.close className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          )}

          {/* Add tile */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground transition-colors"
          >
            {uploading ? (
              <Icons.spinner className="h-5 w-5 animate-spin" />
            ) : (
              <Icons.plus className="h-6 w-6" />
            )}
          </button>
        </div>
      )}

      {/* Empty state for the active tab */}
      {shown.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-square max-h-56 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
        >
          {uploading ? (
            <>
              <Icons.spinner className="h-6 w-6 animate-spin" />
              <span className="text-sm">{stage || "Uploading…"}</span>
            </>
          ) : (
            <>
              <Icons.plus className="h-7 w-7" />
              <span className="text-sm">
                Add {tab === "image" ? "photos" : "videos"}
              </span>
              <span className="text-xs">
                Up to {tab === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB} MB per file
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[tab]}
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <div className="mt-8">
        <PrimaryButton onClick={onContinue} disabled={uploading}>
          {media.length > 0 ? "Save & Continue" : "Skip for Now"}
        </PrimaryButton>
      </div>
    </WizardShell>
  );
}
