export const config = {
  apiBase: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1',
  appName: 'Lifebookz Expert Portal',
};

// Consultancy categories — kept in sync with the backend CONSULT_CATEGORIES.
export const CONSULT_CATEGORIES = [
  { id: 'education', label: 'Education' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'career', label: 'Career & Job' },
  { id: 'business', label: 'Business' },
  { id: 'growth', label: 'Personal Growth' },
  { id: 'health', label: 'Health & Wellness' },
];
