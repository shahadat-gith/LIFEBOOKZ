/** Who the feed can be narrowed to, by the author's own gender. */
export const GENDER_OPTIONS = [
  { value: "", label: "Any gender" },
  { value: "Male", label: "Male authors" },
  { value: "Female", label: "Female authors" },
  { value: "Other", label: "Other" },
];

/** How many stories one page of the feed holds. */
export const PAGE_SIZE = 10;

export const EMPTY_FILTERS = {
  authorName: "",
  profession: "",
  gender: "",
  followingOnly: false,
};

/**
 * The filters as `/stories` expects them.
 *
 * Unset filters are left out entirely so the request URL stays readable and
 * the API keeps its defaults.
 */
export function feedQuery({ profession, authorName, gender, followingOnly }) {
  const params = {};
  if (profession) params.profession = profession;
  if (authorName) params.authorName = authorName;
  if (gender) params.gender = gender;
  if (followingOnly) params.following = "true";
  return params;
}

/**
 * How many filters are narrowing the feed right now.
 *
 * Doubles as the badge count on the filter icon and as the "is anything
 * applied" test, so the two can never disagree.
 */
export function activeFilterCount(filters = {}) {
  return [filters.profession, filters.authorName, filters.gender, filters.followingOnly]
    .filter(Boolean).length;
}
