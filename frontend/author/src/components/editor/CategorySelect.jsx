import Select from "../ui/Select";
import { Icons } from "../../icons";

const TYPE_DESCRIPTIONS = {
  autobiography: "A personal memoir written from your own life experiences.",
  biography: "A written account of a family member or loved one's life story.",
  legend: "A detailed account highlighting a famous or notable figure's impact.",
};

export default function CategorySelect({ storyType, setStoryType, storyLanguage }) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={storyType}
          onChange={(e) => setStoryType(e.target.value)}
          options={[
            { value: "autobiography", label: "Autobiography (My Personal Story)" },
            { value: "biography", label: "Biography (Family or Loved One)" },
            { value: "legend", label: "Legend (Notable / Famous Figure)" },
          ]}
          icon={<Icons.book className="h-4 w-4" />}
        />
        {storyLanguage && (
          <div className="flex items-end pb-2.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icons.translate className="h-4 w-4" />
              <span>
                Language: <strong className="text-foreground">{storyLanguage}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {TYPE_DESCRIPTIONS[storyType]}
      </p>
    </div>
  );
}