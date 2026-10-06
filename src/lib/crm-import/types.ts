/** Bulk customer import — shared types & field catalog */

export const IMPORT_MAX_BYTES = 10 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 2000;

export const IMPORT_TARGET_FIELDS = [
  "ignore",
  "firstName",
  "lastName",
  "fullName",
  "email",
  "phone",
  "country",
  "city",
  "language",
  "currency",
  "desk",
  "saleStatus",
  "source",
  "note",
  "balance",
  "password",
] as const;

export type ImportTargetField = (typeof IMPORT_TARGET_FIELDS)[number];

export type ParsedTable = {
  columns: string[];
  rows: string[][];
  /** True when source had little structure and we synthesized columns */
  unstructured?: boolean;
  warning?: string | null;
  format: string;
  fileName: string;
};

export type ColumnMapping = Record<string, ImportTargetField>;

export type ImportDefaults = {
  desk?: string;
  saleStatus?: string;
  currency?: string;
  source?: string;
  language?: string;
  country?: string;
  /** Rule-based: CRM worker / assignee name applied to all rows without override */
  assigneeName?: string;
};

export type DuplicateMode = "skip" | "update";

export type MappedCustomer = {
  rowIndex: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  language: string;
  currency: string;
  desk: string | null;
  saleStatus: string | null;
  source: string | null;
  assigneeName: string | null;
  note: string | null;
  balance: number;
  password: string | null;
  /** True when email was auto-generated because schema requires unique email */
  emailPlaceholder: boolean;
};

export type RowValidation = {
  rowIndex: number;
  ok: boolean;
  errors: string[];
  warnings: string[];
  duplicateInFile: boolean;
  duplicateInDb: boolean;
  existingUserId: string | null;
  mapped: MappedCustomer;
};

export type ImportRowResult = {
  rowIndex: number;
  status: "created" | "updated" | "skipped" | "error";
  email: string;
  accountLoginId: string | null;
  userId: string | null;
  password: string | null;
  message: string | null;
};
