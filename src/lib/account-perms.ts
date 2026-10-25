/**
 * Trader account permission switches (CRM "Hesap izinleri").
 * Separate from freeze (`User.active`): freeze stays as-is; these are fine-grained.
 */

export type AccountPermFlags = {
  tradingEnabled: boolean;
  withdrawalsEnabled: boolean;
  loginEnabled: boolean;
  loginBlockedMessage: string | null;
  loginBlockedAt: Date | string | null;
};

export function flagsFromUser(u: {
  tradingEnabled?: boolean | null;
  withdrawalsEnabled?: boolean | null;
  loginEnabled?: boolean | null;
  loginBlockedMessage?: string | null;
  loginBlockedAt?: Date | string | null;
}): AccountPermFlags {
  return {
    tradingEnabled: u.tradingEnabled !== false,
    withdrawalsEnabled: u.withdrawalsEnabled !== false,
    loginEnabled: u.loginEnabled !== false,
    loginBlockedMessage: u.loginBlockedMessage ?? null,
    loginBlockedAt: u.loginBlockedAt ?? null,
  };
}

/** Localized trader-facing messages (EN default). */
const TRADING_DISABLED: Record<string, string> = {
  en: "Trading is disabled on your account.",
  tr: "Hesabınızda işlem yetkisi kapalı.",
  ru: "Торговля на вашем счёте отключена.",
  de: "Der Handel auf Ihrem Konto ist deaktiviert.",
  ar: "التداول معطّل على حسابك.",
};

const WITHDRAWALS_DISABLED: Record<string, string> = {
  en: "Withdrawals are disabled on your account.",
  tr: "Hesabınızda para çekme yetkisi kapalı.",
  ru: "Вывод средств на вашем счёте отключён.",
  de: "Auszahlungen auf Ihrem Konto sind deaktiviert.",
  ar: "السحب معطّل على حسابك.",
};

const LOGIN_DISABLED_FALLBACK: Record<string, string> = {
  en: "Access to your account has been closed.",
  tr: "Hesabınıza erişim kapatılmıştır.",
  ru: "Доступ к вашему счёту закрыт.",
  de: "Der Zugang zu Ihrem Konto wurde gesperrt.",
  ar: "تم إغلاق الوصول إلى حسابك.",
};

export function tradingDisabledMessage(locale?: string | null): string {
  const l = (locale || "en").slice(0, 2).toLowerCase();
  return TRADING_DISABLED[l] || TRADING_DISABLED.en;
}

export function withdrawalsDisabledMessage(locale?: string | null): string {
  const l = (locale || "en").slice(0, 2).toLowerCase();
  return WITHDRAWALS_DISABLED[l] || WITHDRAWALS_DISABLED.en;
}

export function loginDisabledFallbackMessage(locale?: string | null): string {
  const l = (locale || "en").slice(0, 2).toLowerCase();
  return LOGIN_DISABLED_FALLBACK[l] || LOGIN_DISABLED_FALLBACK.en;
}

export function isMainAdminEmail(email: string | null | undefined): boolean {
  const envAdmin = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!envAdmin || !email) return false;
  return email.trim().toLowerCase() === envAdmin;
}

export const LOGIN_DISABLED_CODE = "LOGIN_DISABLED";

const MUST_CHANGE_PASSWORD: Record<string, string> = {
  en: "You must set a new password before continuing.",
  tr: "Devam etmeden önce yeni bir şifre belirlemelisiniz.",
  ru: "Перед продолжением нужно задать новый пароль.",
  de: "Sie müssen ein neues Passwort festlegen, bevor Sie fortfahren.",
  ar: "يجب تعيين كلمة مرور جديدة قبل المتابعة.",
};

export function mustChangePasswordMessage(locale?: string | null): string {
  const l = (locale || "en").slice(0, 2).toLowerCase();
  return MUST_CHANGE_PASSWORD[l] || MUST_CHANGE_PASSWORD.en;
}

export function userMustChangePassword(u: { mustChangePassword?: boolean | null }): boolean {
  return u.mustChangePassword === true;
}
