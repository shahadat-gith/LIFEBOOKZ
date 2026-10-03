// Canonical consultancy categories. Shared by expert onboarding, the public
// consult form and booking validation so the ids never drift apart.

export const CONSULT_CATEGORIES = [
  { id: "education", label: "Education" },
  { id: "relationship", label: "Relationship" },
  { id: "career", label: "Career & Job" },
  { id: "business", label: "Business" },
  { id: "growth", label: "Personal Growth" },
  { id: "health", label: "Health & Wellness" },
];

export const CONSULT_CATEGORY_IDS = CONSULT_CATEGORIES.map((c) => c.id);

export function categoryLabel(id) {
  return CONSULT_CATEGORIES.find((c) => c.id === id)?.label || id;
}
