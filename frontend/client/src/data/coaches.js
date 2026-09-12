// Consult categories used across the consultation pages, and the dummy
// availability slots used by the booking form. Expert data itself now comes
// from the backend (`GET /experts/:id`, `POST /consult/match`).

export const coachCategories = [
  { id: "education", label: "Education", icon: "academic" },
  { id: "relationship", label: "Relationship", icon: "heart" },
  { id: "career", label: "Career & Job", icon: "briefcase" },
  { id: "business", label: "Business", icon: "sparkles" },
  { id: "growth", label: "Personal Growth", icon: "userCheck" },
  { id: "health", label: "Health & Wellness", icon: "shield" },
];

export function getCategoryLabel(categoryId) {
  return (
    coachCategories.find((c) => c.id === categoryId)?.label ||
    categoryId ||
    ""
  );
}

// Dummy booking slots — generated so every expert "has" availability.
export function getAvailableSlots() {
  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:30 AM",
    "01:00 PM",
    "02:30 PM",
    "04:00 PM",
    "05:30 PM",
    "07:00 PM",
  ];

  // Next 7 days, starting tomorrow
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  return { timeSlots, days };
}
