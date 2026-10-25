import { z } from "zod";

/** Job title / role in company. Informational, EXCEPT sales_mgr / retention_manager which scope CRM access (see src/lib/crm-scope.ts). */
export const JOB_TITLE_KEYS = [
  "owner_ceo",
  "sales_head",
  "marketing_head",
  "it_specialist",
  "project_manager",
  "analyst",
  "sales_manager",
  "marketer",
  "administrator",
  "sales_mgr",
  "retention_manager",
  "other",
] as const;
export type JobTitle = (typeof JOB_TITLE_KEYS)[number];

type L = "en" | "ru" | "ar" | "tr" | "de";
const LABELS: Record<JobTitle, Record<L, string>> = {
  owner_ceo: { en: "Owner / CEO", tr: "Sahip / CEO", ru: "Владелец / CEO", ar: "المالك / الرئيس التنفيذي", de: "Inhaber / CEO" },
  sales_head: { en: "Head of Sales", tr: "Satış Müdürü", ru: "Руководитель отдела продаж", ar: "رئيس المبيعات", de: "Vertriebsleiter" },
  marketing_head: { en: "Head of Marketing", tr: "Pazarlama Müdürü", ru: "Руководитель отдела маркетинга", ar: "رئيس التسويق", de: "Marketingleiter" },
  it_specialist: { en: "IT / Technical Specialist", tr: "IT / Teknik Uzman", ru: "IT / Технический специалист", ar: "أخصائي تقنية المعلومات / تقني", de: "IT / Technischer Spezialist" },
  project_manager: { en: "Project Manager / PM", tr: "Proje Yöneticisi / PM", ru: "Менеджер проектов / PM", ar: "مدير المشروع / PM", de: "Projektmanager / PM" },
  analyst: { en: "Analyst", tr: "Analist", ru: "Аналитик", ar: "محلل", de: "Analyst" },
  sales_manager: { en: "Sales Manager", tr: "Satış Temsilcisi", ru: "Менеджер по продажам", ar: "مدير مبيعات", de: "Vertriebsmitarbeiter" },
  marketer: { en: "Marketer", tr: "Pazarlamacı", ru: "Маркетолог", ar: "مسوق", de: "Marketer" },
  administrator: { en: "Administrator", tr: "Yönetici", ru: "Администратор", ar: "مسؤول", de: "Administrator" },
  sales_mgr: { en: "Sales Manager", tr: "Sales Manager", ru: "Sales Manager", ar: "Sales Manager", de: "Sales Manager" },
  retention_manager: { en: "Retention Manager", tr: "Retention Manager", ru: "Retention Manager", ar: "Retention Manager", de: "Retention Manager" },
  other: { en: "Other", tr: "Diğer", ru: "Другое", ar: "أخرى", de: "Sonstiges" },
};

export const JOB_TITLE_UI: Record<string, { field: string; register: string; placeholder: string; none: string }> = {
  en: { field: "Job title", register: "Your role in the company", placeholder: "Select your role", none: "—" },
  tr: { field: "Görev / Unvan", register: "Şirketteki rolünüz", placeholder: "Rolünüzü seçin", none: "—" },
  ru: { field: "Должность", register: "Ваша роль в компании", placeholder: "Выберите роль", none: "—" },
  ar: { field: "المسمى الوظيفي", register: "دورك في الشركة", placeholder: "اختر دورك", none: "—" },
  de: { field: "Position", register: "Ihre Rolle im Unternehmen", placeholder: "Rolle auswählen", none: "—" },
};

export function jobTitleUi(locale: string): { field: string; register: string; placeholder: string; none: string } {
  return JOB_TITLE_UI[locale] ?? JOB_TITLE_UI.en;
}

export function jobTitleLabel(key: string | null | undefined, locale: string): string {
  if (!key) return "";
  const row = (LABELS as Record<string, Record<string, string>>)[key];
  if (!row) return key;
  return row[locale] ?? row.en;
}

export function jobTitleOptions(locale: string): { value: JobTitle; label: string }[] {
  return JOB_TITLE_KEYS.map((k) => ({ value: k, label: jobTitleLabel(k, locale) }));
}

/** Accepts a key, "" / null (clears). */
export const jobTitleSchema = z
  .union([z.enum(JOB_TITLE_KEYS), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : v === undefined ? undefined : null));
