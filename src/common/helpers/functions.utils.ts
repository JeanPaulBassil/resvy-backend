import * as bcrypt from "bcryptjs";
import { Transform, TransformFnParams } from "class-transformer";

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/* The `hashString` function is used to hash a user's password using the BCRYPT algorithm. It takes a
user's password as input and returns a promise that resolves to the hashed password as a string. */
export async function hashString(userPassword: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(userPassword, saltRounds);
}

/* The `verifyHash` function is used to compare a user's input password with a hashed password. It
takes two parameters: `userPassword`, which is the user's input password, and `passwordToCompare`,
which is the hashed password to compare against. */
export function verifyHash(
  userPassword: string,
  passwordToCompare: string,
): boolean {
  return bcrypt.compareSync(userPassword, passwordToCompare);
}

/* The `levenshteinDistance` function calculates the Levenshtein distance between two strings. The
Levenshtein distance is a measure of the similarity between two strings, defined as the minimum
number of single-character edits (insertions, deletions, or substitutions) required to change one
string into the other. */
export function levenshteinDistance(a: string, b: string): number {
  const distanceMatrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) {
    distanceMatrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    distanceMatrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      distanceMatrix[j][i] = Math.min(
        distanceMatrix[j][i - 1] + 1,
        distanceMatrix[j - 1][i] + 1,
        distanceMatrix[j - 1][i - 1] + indicator,
      );
    }
  }

  return distanceMatrix[b.length][a.length];
}

/* The `calculatePhysicalDistanceBetweenCoordinates` function calculates the physical distance
between two sets of latitude and longitude coordinates. It uses the Haversine formula to calculate
the distance between two points on the Earth's surface given their latitude and longitude coordinates. */
export function calculatePhysicalDistanceBetweenCoordinates(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Used on swagger properties to transform string to boolean
export function ToBoolean(): (target: any, key: string) => void {
  return Transform((params: TransformFnParams) => {
    const { value } = params;
    if (typeof value === "boolean") {
      return value;
    }
    if (value?.toString()?.toLowerCase() === "false") {
      return false;
    }
    if (value?.toString()?.toLowerCase() === "true") {
      return true;
    }
    return undefined;
  });
}

export function ToNumber(): (target: any, key: string) => void {
  return Transform((params: TransformFnParams) => {
    const { value } = params;
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  });
}

export const calculateHumanReadableRemainingTime = (
  futureDate: string | undefined,
) => {
  if (!futureDate) return "N/A";

  const currentDate = new Date();
  const expDate = new Date(futureDate);

  let years = expDate.getFullYear() - currentDate.getFullYear();
  let months = expDate.getMonth() - currentDate.getMonth();
  let days = expDate.getDate() - currentDate.getDate();

  if (days < 0) {
    months--;
    days += new Date(expDate.getFullYear(), expDate.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  let result = "";
  if (years > 0) result += `${years} year${years > 1 ? "s" : ""} `;
  if (months > 0) result += `${months} month${months > 1 ? "s" : ""} `;
  if (days > 0) result += `${days} day${days > 1 ? "s" : ""}`;

  return result.trim();
};

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove plus if it exists
  if (phoneNumber.startsWith("+")) {
    phoneNumber = phoneNumber.substring(1);
  }

  if (phoneNumber.startsWith("03")) {
    phoneNumber = "3" + phoneNumber.substring(2);
  }

  if (phoneNumber.startsWith("961")) {
    if (phoneNumber.substring(3).startsWith("03")) {
      phoneNumber = "961" + "3" + phoneNumber.substring(5);
    }
  } else if (!phoneNumber.startsWith("961")) {
    phoneNumber = "961" + phoneNumber;
  }
  return phoneNumber;
}
