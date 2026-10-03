import EmptyState from "../../../components/common/EmptyState";
import { ExpertMatchCard } from "./ExpertMatchCard";
import { resultHeading } from "../utils";

/**
 * The experts the matcher came back with, best first. Only experts who are
 * actually available (approved, switched on, not in a live session) appear —
 * an empty list genuinely means "nobody available right now".
 */
export default function MatchResults({ experts = [], bookingId, onBook }) {
  return (
    <section className="scroll-mt-24 space-y-6 pt-4">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
          {experts.length > 0 ? "Top Matches" : "No Matches"}
        </p>
        <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
          {resultHeading(experts.length)}
        </h2>
      </div>

      {experts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => (
            <ExpertMatchCard
              key={expert.id || expert._id}
              expert={expert}
              booking={bookingId === (expert.id || expert._id)}
              onBook={onBook}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={null}
          title="No available expert found in this category right now"
          description="Please try again a bit later — experts come online all the time."
        />
      )}
    </section>
  );
}
