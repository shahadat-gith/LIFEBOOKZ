import { useRef, useState } from "react";
import { Icons } from "../../icons";
import { WizardShell } from "./WizardShell";
import { PrimaryButton, LinkButton } from "./wizardShared";
import * as storyApi from "../../utils/client";
import toast from "react-hot-toast";

const TABS = [
  { key: "image", label: "Photos" },
  { key: "video", label: "Video" },
  { key: "audio", label: "Audio" },
];

const ACCEPT = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
};

export default function AddMediaStep({
  story,
  onChange,
  onContinue,
  onBack,
}) {
  const [tab, setTab] = useState("image");
  const [uploading, setUploading] = useState(false);
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
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} is over 50 MB.`);
          continue;
        }
        uploaded.push(await storyApi.uploadMedia(file));
      }
      if (uploaded.length > 0) {
        onChange({ ...story, media: [...media, ...uploaded] });
        toast.success(`${uploaded.length} file(s) added`);
      }
    } catch {
      toast.error("Failed to upload media");
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(idx) {
    onChange({ ...story, media: media.filter((_, i) => i !== idx) });
  }

  const shown = byType(tab);

  return (
    <WizardShell step={5} totalSteps={10} title="Add Media" onBack={onBack}>
      <p className="text-center text-sm text-muted-foreground mb-5">
        Add photos, videos or audio
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
              {count > 0 && t.key === "image" && ` (${count})`}
            </button>
          );
        })}
      </div>

      {/* Tile grid */}
      {shown.length > 0 ? (
        <div className="grid grid-cols-3 gap-2.5">
          {media.map((m, idx) =>
            m.type !== tab ? null : (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden bg-muted"
              >
                {m.type === "image" && (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                )}
                {m.type === "video" && (
                  <video src={m.url} className="w-full h-full object-cover" muted />
                )}
                {m.type === "audio" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icons.chat className="h-6 w-6 text-muted-foreground" />
                  </div>
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
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-square max-h-56 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
        >
          {uploading ? (
            <Icons.spinner className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Icons.plus className="h-7 w-7" />
              <span className="text-sm">
                Add {tab === "image" ? "photos" : tab === "video" ? "videos" : "audio"}
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

      <div className="mt-8 space-y-3">
        <PrimaryButton onClick={() => inputRef.current?.click()} disabled={uploading}>
          Add More Media
        </PrimaryButton>
        <div className="text-center">
          <LinkButton onClick={onContinue}>Skip for Now</LinkButton>
        </div>
        <PrimaryButton onClick={onContinue} className="hidden" />
      </div>
    </WizardShell>
  );
}
