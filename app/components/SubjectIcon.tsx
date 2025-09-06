// app/components/SubjectIcon.tsx
import type { IconName } from "@/data/subjects";
import {
  Calculator,
  BookOpen,
  Atom,
  Landmark,
  Globe2,
  MessageSquareText,
  type LucideProps,
} from "lucide-react";

// Record maps each IconName string to a Lucide component
const ICONS: Record<IconName, React.FC<LucideProps>> = {
  calculator: Calculator,
  book: BookOpen,
  atom: Atom,
  castle: Landmark,
  globe: Globe2,
  chat: MessageSquareText,
};

export default function SubjectIcon({
  name,
  size = 44,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = ICONS[name];
  return <Icon size={size} strokeWidth={strokeWidth} />;
}
