/** Client-only helpers for auth forms. They do not change the register or login API. */

export type PasswordStrength = "empty" | "short" | "ok" | "strong";

export type PhoneCountry = {
  iso: string;
  dial: string;
  groups: number[];
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "TR", dial: "90", groups: [3, 3, 2, 2] },
  { iso: "US", dial: "1", groups: [3, 3, 4] },
  { iso: "GB", dial: "44", groups: [4, 6] },
  { iso: "DE", dial: "49", groups: [3, 3, 4] },
  { iso: "FR", dial: "33", groups: [1, 2, 2, 2, 2] },
  { iso: "AE", dial: "971", groups: [2, 3, 4] },
  { iso: "SA", dial: "966", groups: [2, 3, 4] },
  { iso: "RU", dial: "7", groups: [3, 3, 2, 2] },
  { iso: "NL", dial: "31", groups: [2, 3, 4] },
  { iso: "AZ", dial: "994", groups: [2, 3, 2, 2] },
];

const REGISTER_ERROR_KEYS: Record<string, string> = {
  "Enter a valid email": "auth.emailInvalid",
  "Password must be at least 8 characters": "auth.passwordMin",
  "First name and last name are required": "auth.nameRequired",
  "This email is already registered": "auth.emailTaken",
  "Enter a valid referral code.": "auth.referralInvalid",
  "Referral code zorunludur. / Referral code is required.": "auth.referralRequired",
  "Invalid role": "auth.registerFailed",
  "Registration error": "auth.registerFailed",
};

const LOGIN_ERROR_KEYS: Record<string, string> = {
  "Invalid credentials": "auth.badCredentials",
  "Too many attempts. Try again later.": "auth.rateLimit",
  "Email, username or account ID and password are required": "auth.credentialsRequired",
  "Account temporarily locked after failed logins": "auth.locked",
  "Account expired": "auth.expired",
  "Account frozen": "auth.frozen",
  "Sign-in error": "auth.signInError",
};

export function emailOk(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return "empty";
  if (password.length < 8) return "short";
  let kinds = 0;
  if (/[a-z]/.test(password)) kinds += 1;
  if (/[A-Z]/.test(password)) kinds += 1;
  if (/\d/.test(password)) kinds += 1;
  if (/[^A-Za-z0-9]/.test(password)) kinds += 1;
  return kinds >= 3 ? "strong" : "ok";
}

export function passwordHintKey(level: PasswordStrength): string {
  return `auth.passwordHint.${level}`;
}

export function defaultPhoneCountry(locale: string): string {
  if (locale === "tr") return "TR";
  if (locale === "de") return "DE";
  if (locale === "ru") return "RU";
  if (locale === "ar") return "SA";
  return "US";
}

export function phoneCountry(iso: string): PhoneCountry {
  return PHONE_COUNTRIES.find((row) => row.iso === iso) || PHONE_COUNTRIES[1];
}

export function digitsOnly(value: string, max = 15): string {
  return value.replace(/\D/g, "").slice(0, max);
}

export function formatNational(digits: string, groups: number[]): string {
  const parts: string[] = [];
  let index = 0;
  for (let i = 0; i < groups.length; i += 1) {
    if (index >= digits.length) break;
    const size = groups[i];
    parts.push(digits.slice(index, index + size));
    index += size;
  }
  if (index < digits.length) parts.push(digits.slice(index));
  return parts.join(" ");
}

/** Same `phone` string the register API already accepts. Empty stays blank. */
export function composePhone(iso: string, nationalDigits: string): string {
  const digits = digitsOnly(nationalDigits);
  if (!digits) return "";
  const country = phoneCountry(iso);
  return `+${country.dial} ${formatNational(digits, country.groups)}`;
}

export function phoneTooShort(nationalDigits: string): boolean {
  const digits = digitsOnly(nationalDigits);
  return digits.length > 0 && digits.length < 7;
}

export function registerErrorKey(message: string): string {
  return REGISTER_ERROR_KEYS[message.trim()] || "auth.registerFailed";
}

export function loginErrorKey(message: string): string {
  return LOGIN_ERROR_KEYS[message.trim()] || "auth.signInError";
}
