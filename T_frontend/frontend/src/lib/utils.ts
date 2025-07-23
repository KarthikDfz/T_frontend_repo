import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind support
 * 
 * This utility function combines clsx and tailwind-merge to provide a flexible
 * way to conditionally apply classes while properly handling Tailwind CSS specificity.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 