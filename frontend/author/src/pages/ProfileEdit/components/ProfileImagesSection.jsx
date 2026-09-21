import { useRef } from "react";
import toast from "react-hot-toast";

import Avatar from "../../../components/ui/Avatar";
import { Icons } from "../../../icons";
import { COVER_VARIANTS } from "../utils";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * The avatar and the two cover crops.
 *
 * Choosing a file only opens the cropper — nothing is uploaded until the
 * form is saved. The file inputs belong to this section so the page never
 * has to hold refs to them.
 */
export default function ProfileImagesSection({
  author,
  avatarPreview,
  coverPreviews,
  onFileChosen,
  onClearCover,
}) {
  const inputRefs = {
    avatar: useRef(null),
    desktop: useRef(null),
    mobile: useRef(null),
  };

  function pick(kind) {
    inputRefs[kind].current?.click();
  }

  function handleFile(kind, event) {
    const file = event.target.files?.[0] || null;
    // Reset so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Images must be 15 MB or smaller.");
      return;
    }

    onFileChosen(kind, file);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-base font-bold text-foreground">
        Profile images
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Position each image exactly how it should appear.
      </p>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <Avatar
              src={avatarPreview}
              name={author.fullName}
              size="xl"
              className="h-28 w-28 ring-4 ring-card"
            />
            <button
              type="button"
              onClick={() => pick("avatar")}
              aria-label="Change profile photo"
              className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:opacity-100"
            >
              <Icons.camera className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] font-medium">Change</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => pick("avatar")}
            className="text-xs font-medium text-primary hover:underline"
          >
            {avatarPreview ? "Change photo" : "Upload photo"}
          </button>
          <p className="max-w-[10rem] text-center text-[11px] text-muted-foreground">
            Square crop, 1:1 — shown as a circle.
          </p>
        </div>

        {/* Covers */}
        <div className="grid flex-1 gap-4">
          {COVER_VARIANTS.map((variant) => {
            const Icon = variant.icon;
            const preview = coverPreviews[variant.key];

            return (
              <div key={variant.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {variant.label}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({variant.ratio})
                    </span>
                  </span>
                  {preview && (
                    <button
                      type="button"
                      onClick={() => onClearCover(variant.key)}
                      className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => pick(variant.key)}
                  className="relative h-24 w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/50"
                  style={{ aspectRatio: `${variant.aspect}` }}
                >
                  {preview ? (
                    <>
                      <img
                        src={preview}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity hover:opacity-100">
                        <Icons.edit className="mr-1.5 h-4 w-4" /> Reposition
                      </span>
                    </>
                  ) : (
                    <span className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Icons.upload className="h-5 w-5" />
                      <span className="mt-1 text-xs">Choose image</span>
                    </span>
                  )}
                </button>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {variant.hint}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* File pickers */}
      {Object.keys(inputRefs).map((kind) => (
        <input
          key={kind}
          ref={inputRefs[kind]}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(kind, event)}
        />
      ))}
    </section>
  );
}
