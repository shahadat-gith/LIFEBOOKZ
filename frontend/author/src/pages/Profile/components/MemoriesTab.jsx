import { Icons } from "../../icons";

/** Photo grid from chapter + story media. */
export default function MemoriesTab({ chapterRows, empty }) {
  const media = chapterRows
    .flatMap((ch) => [...(ch.media || []), ...(ch.stories || []).flatMap((s) => s.media || [])])
    .filter((m) => m.type === "image");

  if (media.length === 0) {
    return empty(Icons.camera, "No memories yet", "Photos you add to stories appear here.");
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
      {media.map((m, i) => (
        <img key={i} src={m.url} alt="" className="aspect-square w-full rounded-xl object-cover" />
      ))}
    </div>
  );
}
