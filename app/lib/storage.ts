import { BookingState } from "@/app/types";

const STORAGE_KEY_USER_ID = "droptix_demo_user_id";
const STORAGE_KEY_BOOKING_STATE = "droptix_demo_booking_state";

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "user-demo-ssr";
  
  let userId = localStorage.getItem(STORAGE_KEY_USER_ID);
  if (!userId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    userId = `user-demo-${randomSuffix}`;
    localStorage.setItem(STORAGE_KEY_USER_ID, userId);
  }
  return userId;
}

export function setCustomUserId(newUserId: string): string {
  if (typeof window !== "undefined") {
    const trimmed = newUserId.trim() || `user-demo-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(STORAGE_KEY_USER_ID, trimmed);
    return trimmed;
  }
  return newUserId;
}

export function getStoredBookingState(): Partial<BookingState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKING_STATE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBookingState(state: Partial<BookingState>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredBookingState() || {};
    const updated = { ...existing, ...state };
    localStorage.setItem(STORAGE_KEY_BOOKING_STATE, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save booking state", e);
  }
}

export function clearBookingState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_BOOKING_STATE);
}
