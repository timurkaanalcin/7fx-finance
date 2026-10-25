import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const IMPERSONATION_READONLY_CODE = "IMPERSONATION_READONLY";
export const IMPERSONATION_READONLY_ERROR = "Read-only while viewing as this user";

/** Block account mutations while an admin is viewing the terminal as this user. */
export async function impersonationReadonlyResponse(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session?.impersonatedBy) return null;
  return NextResponse.json(
    { error: IMPERSONATION_READONLY_ERROR, code: IMPERSONATION_READONLY_CODE },
    { status: 403 }
  );
}
