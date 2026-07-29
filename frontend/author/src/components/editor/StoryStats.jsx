import { Icons } from "../../icons";

export default function StoryStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-5 text-sm text-muted-foreground px-1">
      <span className="flex items-center gap-1.5">
        <Icons.heartRegular className="h-4 w-4" />
        {stats.likes || 0} likes
      </span>
      <span className="flex items-center gap-1.5">
        <Icons.chat className="h-4 w-4" />
        {stats.comments || 0} comments
      </span>
      <span className="flex items-center gap-1.5">
        <Icons.share className="h-4 w-4" />
        {stats.shares || 0} shares
      </span>
    </div>
  );
}