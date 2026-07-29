import Input from "../ui/Input";
import { Icons } from "../../icons";

export default function StoryTitleInput({ title, setTitle, storyType, slugPreview }) {
  return (
    <div>
      <Input
        label="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={
          storyType === "autobiography"
            ? "e.g., My Journey Through Life..."
            : storyType === "biography"
            ? "e.g., The Remarkable Life of My Father..."
            : "e.g., The Untold Legacy of..."
        }
        icon={<Icons.edit className="h-4 w-4" />}
        maxLength={150}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">
          {slugPreview && (
            <span className="flex items-center gap-1">
              <Icons.link className="h-3 w-3" />
              lifebookz.com/feed/story/
              <span className="text-primary font-mono">{slugPreview}</span>
            </span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">{title.length}/150</span>
      </div>
    </div>
  );
}