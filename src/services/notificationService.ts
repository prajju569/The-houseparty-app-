/**
 * Local push notifications for event reminders and waitlist updates.
 * Uses expo-notifications — no server needed for scheduled reminders.
 * Notification IDs are stored in AsyncStorage keyed by bookingRef so
 * they can be cancelled if the user cancels an RSVP.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIF_MAP_KEY = '@hp_notif_ids';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Event Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function saveNotifIds(bookingRef: string, ids: string[]) {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    map[bookingRef] = ids;
    await AsyncStorage.setItem(NOTIF_MAP_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

async function getNotifIds(bookingRef: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    return map[bookingRef] ?? [];
  } catch { return []; }
}

// Fix #10: Schedule two reminders — day before at 10 AM + 1 hour before event
export async function scheduleEventReminders(opts: {
  bookingRef: string;
  eventTitle: string;
  eventDate: string; // ISO string
  area: string;
}): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const eventMs = new Date(opts.eventDate).getTime();
  const now = Date.now();
  const ids: string[] = [];

  // Day-before reminder (10 AM the day before)
  const dayBefore = new Date(opts.eventDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(10, 0, 0, 0);
  if (dayBefore.getTime() > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Tomorrow: ${opts.eventTitle} 🎉`,
        body: `Your party in ${opts.area} is tomorrow. Don't forget to go! Ref: ${opts.bookingRef}`,
        data: { bookingRef: opts.bookingRef },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore },
    });
    ids.push(id);
  }

  // 1-hour reminder
  const oneHourBefore = new Date(eventMs - 60 * 60 * 1000);
  if (oneHourBefore.getTime() > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${opts.eventTitle} starts in 1 hour 🔥`,
        body: `Get ready! Head to ${opts.area}. Your booking: ${opts.bookingRef}`,
        data: { bookingRef: opts.bookingRef },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: oneHourBefore },
    });
    ids.push(id);
  }

  await saveNotifIds(opts.bookingRef, ids);
}

// Cancel reminders when user cancels RSVP
export async function cancelEventReminders(bookingRef: string): Promise<void> {
  const ids = await getNotifIds(bookingRef);
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
  const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY);
  if (raw) {
    const map: Record<string, string[]> = JSON.parse(raw);
    delete map[bookingRef];
    await AsyncStorage.setItem(NOTIF_MAP_KEY, JSON.stringify(map));
  }
}

// Fix #12: Notify user when they're promoted from waitlist
export async function notifyWaitlistPromotion(opts: {
  eventTitle: string;
  bookingRef: string;
}): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `You're in! 🎉 Spot opened at ${opts.eventTitle}`,
      body: `Your waitlist booking ${opts.bookingRef} is now CONFIRMED. Open the app to view your ticket.`,
      data: { bookingRef: opts.bookingRef },
    },
    trigger: null, // fire immediately
  });
}
