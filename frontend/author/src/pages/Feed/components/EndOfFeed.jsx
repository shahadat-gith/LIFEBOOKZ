/** The divider that closes the feed once every page has been read. */
export default function EndOfFeed() {
  return (
    <div className="flex justify-center py-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
        <div className="h-px w-8 bg-border" />
        <span>You&apos;ve reached the end</span>
        <div className="h-px w-8 bg-border" />
      </div>
    </div>
  );
}
