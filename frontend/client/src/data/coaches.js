// Dummy data for the "Talk to a Coach" feature.
// No backend yet — replace with API calls later.

export const coachCategories = [
  { id: "education", label: "Education", icon: "academic" },
  { id: "relationship", label: "Relationship", icon: "heart" },
  { id: "career", label: "Career & Job", icon: "briefcase" },
  { id: "business", label: "Business", icon: "sparkles" },
  { id: "growth", label: "Personal Growth", icon: "userCheck" },
  { id: "health", label: "Health & Wellness", icon: "shield" },
];

export const coaches = [
  // ---- Education ----
  {
    id: "coach-1",
    name: "Dr. Sarah Mitchell",
    title: "Academic & Study Coach",
    category: "education",
    rating: 4.9,
    sessions: 128,
    price: 45,
    experience: 12,
    languages: ["English", "Hindi"],
    bio: "Helps students plan learning journeys, pick the right courses, and build study habits that actually stick.",
    avatarColor: "bg-primary text-primary-foreground ring-4 ring-primary/10",
  },
  {
    id: "coach-2",
    name: "Rahul Verma",
    title: "Exam & Career Guidance Coach",
    category: "education",
    rating: 4.8,
    sessions: 96,
    price: 35,
    experience: 8,
    languages: ["English", "Hindi"],
    bio: "Guides students through entrance exams, scholarships and career-path decisions with practical roadmaps.",
    avatarColor: "bg-secondary text-secondary-foreground ring-4 ring-secondary/10",
  },

  // ---- Relationship ----
  {
    id: "coach-3",
    name: "Meera Iyer",
    title: "Relationship & Family Coach",
    category: "relationship",
    rating: 4.9,
    sessions: 210,
    price: 55,
    experience: 15,
    languages: ["English", "Tamil"],
    bio: "Specializes in building healthier connections, resolving conflicts and creating lasting bonds with loved ones.",
    avatarColor: "bg-accent text-accent-foreground ring-4 ring-accent/10",
  },
  {
    id: "coach-4",
    name: "James Carter",
    title: "Couples Communication Coach",
    category: "relationship",
    rating: 4.7,
    sessions: 87,
    price: 60,
    experience: 10,
    languages: ["English"],
    bio: "Helps couples communicate honestly, rebuild trust and navigate big life transitions together.",
    avatarColor: "bg-rose-600 text-white ring-4 ring-rose-600/10",
  },

  // ---- Career & Job ----
  {
    id: "coach-5",
    name: "Ananya Sharma",
    title: "Career Transition Coach",
    category: "career",
    rating: 4.8,
    sessions: 154,
    price: 50,
    experience: 11,
    languages: ["English", "Hindi"],
    bio: "Finds the right career path for you, sharpens your skills and helps you land the job you actually want.",
    avatarColor: "bg-emerald-600 text-white ring-4 ring-emerald-600/10",
  },
  {
    id: "coach-6",
    name: "David Kim",
    title: "Resume & Interview Coach",
    category: "career",
    rating: 4.6,
    sessions: 73,
    price: 40,
    experience: 7,
    languages: ["English", "Korean"],
    bio: "Crafts standout resumes, prepares you for interviews and negotiates better offers with confidence.",
    avatarColor: "bg-teal-600 text-white ring-4 ring-teal-600/10",
  },

  // ---- Business ----
  {
    id: "coach-7",
    name: "Priya Nair",
    title: "Startup & Business Coach",
    category: "business",
    rating: 4.9,
    sessions: 140,
    price: 75,
    experience: 14,
    languages: ["English", "Malayalam"],
    bio: "Turns ideas into opportunities — from validating your concept to building a successful venture.",
    avatarColor: "bg-amber-600 text-white ring-4 ring-amber-600/10",
  },
  {
    id: "coach-8",
    name: "Michael Zhang",
    title: "Growth & Marketing Coach",
    category: "business",
    rating: 4.7,
    sessions: 65,
    price: 70,
    experience: 9,
    languages: ["English", "Mandarin"],
    bio: "Grows your business with practical marketing strategies, pricing and customer-retention playbooks.",
    avatarColor: "bg-orange-600 text-white ring-4 ring-orange-600/10",
  },

  // ---- Personal Growth ----
  {
    id: "coach-9",
    name: "Sofia Rossi",
    title: "Confidence & Mindset Coach",
    category: "growth",
    rating: 4.8,
    sessions: 118,
    price: 48,
    experience: 10,
    languages: ["English", "Italian"],
    bio: "Discovers your strengths, boosts your confidence and helps you become the best version of yourself.",
    avatarColor: "bg-primary text-primary-foreground ring-4 ring-primary/10",
  },
  {
    id: "coach-10",
    name: "Arjun Mehta",
    title: "Habit & Productivity Coach",
    category: "growth",
    rating: 4.7,
    sessions: 92,
    price: 42,
    experience: 8,
    languages: ["English", "Hindi"],
    bio: "Builds systems and habits that keep you focused, motivated and moving toward your goals every day.",
    avatarColor: "bg-secondary text-secondary-foreground ring-4 ring-secondary/10",
  },

  // ---- Health & Wellness ----
  {
    id: "coach-11",
    name: "Dr. Emily Watson",
    title: "Wellness & Stress Coach",
    category: "health",
    rating: 4.9,
    sessions: 176,
    price: 58,
    experience: 13,
    languages: ["English"],
    bio: "Helps you manage stress, sleep better and build a calmer, healthier and happier daily life.",
    avatarColor: "bg-teal-600 text-white ring-4 ring-teal-600/10",
  },
  {
    id: "coach-12",
    name: "Nina Patel",
    title: "Fitness & Nutrition Coach",
    category: "health",
    rating: 4.6,
    sessions: 84,
    price: 38,
    experience: 6,
    languages: ["English", "Gujarati"],
    bio: "Keeps you fit and focused with realistic workout plans and simple nutrition guidance that fits your life.",
    avatarColor: "bg-green-600 text-white ring-4 ring-green-600/10",
  },
];

export function getCoachById(id) {
  return coaches.find((coach) => coach.id === id) || null;
}

export function getCoachesByCategory(categoryId) {
  if (!categoryId || categoryId === "all") return coaches;
  return coaches.filter((coach) => coach.category === categoryId);
}

// Dummy booking slots — generated per coach so every expert "has" availability.
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