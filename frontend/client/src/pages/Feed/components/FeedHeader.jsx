import { motion } from "framer-motion";

import FilterButton from "../../../components/feed/FilterButton";

/** The page title, its one-line description, and the filter icon. */
export default function FeedHeader({ filterCount, onOpenFilters }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Feed
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover the latest stories shared by our community.
          </p>
        </div>

        <FilterButton count={filterCount} onClick={onOpenFilters} />
      </div>
    </motion.div>
  );
}
