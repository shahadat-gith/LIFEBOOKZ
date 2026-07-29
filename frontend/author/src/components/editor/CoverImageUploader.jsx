import { Icons } from "../../icons";

export default function CoverImageUploader({ coverPreview, coverFileRef, handleCoverChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Cover Image / Portrait
      </label>
      <div
        onClick={() => coverFileRef.current?.click()}
        className="relative cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden bg-muted/20 group"
      >
        {coverPreview ? (
          <div className="relative">
            <img src={coverPreview} alt="Cover" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Change cover photo</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
            <Icons.camera className="h-8 w-8" />
            <span className="text-sm">Upload a cover image or portrait</span>
            <span className="text-xs">Recommended: 1200 x 600 px &bull; Max 10 MB</span>
          </div>
        )}
      </div>
      <input
        ref={coverFileRef}
        type="file"
        accept="image/*"
        onChange={handleCoverChange}
        className="hidden"
      />
    </div>
  );
}