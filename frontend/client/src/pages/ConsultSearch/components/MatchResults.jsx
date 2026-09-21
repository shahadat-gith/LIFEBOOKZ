import NoDataState from "../../../components/common/NoDataState";
import { ExpertMatchCard } from "./ExpertMatchCard";
import { resultHeading } from "../utils";

/**
 * The experts the matcher came back with, best first.
 *
 * `matched: false` means nobody in the chosen category fit the description
 * and the API fell back to its highest rated experts — worth saying out loud
 * rather than passing off as a personal match.
 */
export default function MatchResults({ experts = [], matched = true, onBook }) {
  return (
    <section className="scroll-mt-24 space-y-6 pt-4">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
          {experts.length > 0 ? "Top Matches" : "No Matches"}
        </p>
        <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
          {resultHeading(experts.length)}
        </h2>
        {!matched && experts.length > 0 && (
          <p className="mx-auto max-w-xl text-xs text-muted-foreground">
            Showing the highest rated experts in this category.
          </p>
        )}
      </div>

      {experts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => (
            <ExpertMatchCard
              key={expert.id || expert._id}
              expert={expert}
              onBook={onBook}
            />
          ))}
        </div>
      ) : (
        <NoDataState
          icon={null}
          title="No experts matched"
          description="Try a broader description or a different category."
        />
      )}
    </section>
  );
}
