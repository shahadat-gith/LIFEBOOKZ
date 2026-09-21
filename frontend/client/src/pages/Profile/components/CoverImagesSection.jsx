import { Icons } from "../../../icons";
import { COVER_VARIANTS } from "../utils";

/**
 * The two cover crops — one for desktops, one for phones — each showing the
 * stored image or an empty slot, with the crop ratio it will be displayed at
 * and a Remove that drops the pending one.
 */
export default function CoverImagesSection({
  coverPreviews,
  coverInputRefs,
  onRemove,
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:p-6">
      <div>
        <h2 className="font-display text-base font-bold text-foreground">
          Cover images
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Choose and position a crop for each screen size.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {COVER_VARIANTS.map((variant) => {
          const preview = coverPreviews[variant.key];
          const Icon = variant.icon;

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
                    onClick={() => onRemove(variant.key)}
                    className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    Remove
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => coverInputRefs[variant.key].current?.click()}
                className="relative w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/50"
                style={{ aspectRatio: `${variant.aspect}` }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
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
    </section>
  );
}
