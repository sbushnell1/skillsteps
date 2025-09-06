// data/ages.ts
import type { Level } from "@/data/curriculum";

export const AGES = [5,6,7,8,9,10,11,12,13,14] as const;
export type Age = typeof AGES[number];
export const DEFAULT_AGE: Age = 10;

// Map ages to school years (tweak if your scheme differs)
export const AGE_TO_LEVEL: Record<Age, Level> = {
  5:"y1", 6:"y2", 7:"y3", 8:"y4", 9:"y5",
  10:"y6", 11:"y7", 12:"y8", 13:"y9", 14:"y10",
};

export function levelForAge(age: number): Level {
  const clamped = Math.max(AGES[0], Math.min(AGES[AGES.length-1], Math.round(age)));
  return AGE_TO_LEVEL[clamped as Age];
}
