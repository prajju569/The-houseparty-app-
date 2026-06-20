/**
 * Notification service — stubbed for Expo Go compatibility.
 *
 * expo-notifications remote push support was removed from Expo Go in SDK 53.
 * These are no-ops until a development build is used.
 * TODO: restore full implementation when building with `eas build --profile development`.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleEventReminders(_opts: {
  bookingRef: string;
  eventTitle: string;
  eventDate: string;
  area: string;
}): Promise<void> {
  // no-op in Expo Go
}

export async function cancelEventReminders(_bookingRef: string): Promise<void> {
  // no-op in Expo Go
}

export async function notifyWaitlistPromotion(_opts: {
  eventTitle: string;
  bookingRef: string;
}): Promise<void> {
  // no-op in Expo Go
}
