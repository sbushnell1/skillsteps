// data/subjects.ts
export type IconName = "calculator" | "book" | "atom" | "castle" | "globe" | "chat";

export type Subject = {
  slug: string;
  title: string;
  color: string;
  icon: IconName;
};

export const SUBJECTS: Subject[] = [
  { slug: "maths",     title: "Maths",     color: "#d5e1f0", icon: "calculator" },
  { slug: "english",   title: "English",   color: "#f36a73", icon: "book" },
  { slug: "science",   title: "Science",   color: "#7bd18e", icon: "atom" },
  { slug: "history",   title: "History",   color: "#f2d047", icon: "castle" },
  { slug: "geography", title: "Geography", color: "#8fd2d9", icon: "globe" },
  { slug: "languages", title: "Languages", color: "#7fc8ff", icon: "chat" },
];
