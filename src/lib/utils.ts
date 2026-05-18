import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  const symbols: Record<string, string> = {
    USD: '$',
    INR: 'Rs.',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;

  return `${symbol} ${amount.toFixed(2)}`;
}