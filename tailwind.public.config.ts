import type { Config } from "tailwindcss";
import base from "./tailwind.config";

/**
 * Utilities for the public site and auth screens only.
 * The desk and CRM keep the full sheet in tailwind.config.ts.
 */
const config: Config = {
  ...base,
  content: [
    "./src/app/(public)/**/*.{js,ts,jsx,tsx}",
    "./src/app/(auth)/**/*.{js,ts,jsx,tsx}",
    "./src/app/layout.tsx",
    "./src/app/error.tsx",
    "./src/components/landing/**/*.{js,ts,jsx,tsx}",
    "./src/components/auth/**/*.{js,ts,jsx,tsx}",
    "./src/components/public/**/*.{js,ts,jsx,tsx}",
    "./src/components/i18n/**/*.{js,ts,jsx,tsx}",
    "./src/components/InstallBanner.tsx",
    "./src/components/system/ErrorFallback.tsx",
  ],
};

export default config;
