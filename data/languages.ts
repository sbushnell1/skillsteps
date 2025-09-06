export type LangCode = "de" | "fr" | "es"; // add more later

export const LANGUAGES: { code: LangCode; name: string; flag: string }[] = [
  { code: "de", name: "German",  flag: "🇩🇪" },
  { code: "fr", name: "French",  flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
];

// Shared skill list for all languages
export const LANGUAGE_SKILLS = [
  { slug: "greetings",        title: "Greetings" },
  { slug: "family",           title: "Family" },
  { slug: "food-drink",       title: "Food & Drink" },
  { slug: "hobbies",          title: "Hobbies" },
  { slug: "ordering",         title: "Ordering" },
  { slug: "travel-directions",title: "Travel & Directions" },
];
