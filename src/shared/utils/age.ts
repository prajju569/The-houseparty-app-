/** Compute age in whole years from an ISO date-of-birth string. Returns null if
 *  the value is missing or unparseable. Uses device time at call. */
export function computeAge(dobIso: string | null | undefined): number | null {
  if (!dobIso) return null;
  const dob = new Date(dobIso);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}
