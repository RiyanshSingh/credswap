/**
 * @file Utility Helpers
 * @description Common classname merging helper combining clsx and tailwind-merge.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional Tailwind CSS class names without style collisions.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

