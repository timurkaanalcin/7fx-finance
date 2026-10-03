"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  desk: string | null;
  lastLoginAt: string | null;
  canManageUsers?: boolean;
  canApproveDeposits?: boolean;
  canEditRates?: boolean;
  canManageMethods?: boolean;
  canAdjustBalance?: boolean;
};

export default function WorkersPage() {
  const { i18n, code, deskName } = useCrmLabels();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setRows((d.users || []).filter((u: Row & { role: string }) => u.role === "ADMIN")))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">{i18n("crm.nav.workers")}</h1>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.name")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.email")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.desk")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.active")}</th>
              <th className="px-3 py-2">{i18n("crm.permissions")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.lastLogin")}</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-neutral-200">
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2 text-neutral-500">{u.email}</td>
                <td className="px-3 py-2">{u.desk ? deskName(u.desk) : "—"}</td>
                <td className="px-3 py-2">{u.active ? i18n("crm.ui.active") : i18n("crm.ui.closed")}</td>
                <td className="px-3 py-2 text-[9px] text-neutral-500">
                  {[
                    u.canManageUsers && i18n("crm.perm.users"),
                    u.canApproveDeposits && i18n("crm.perm.deposits"),
                    u.canEditRates && i18n("crm.perm.rates"),
                    u.canManageMethods && i18n("crm.perm.methods"),
                    u.canAdjustBalance && i18n("crm.perm.balance"),
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
                <td className="px-3 py-2 text-[10px] text-neutral-500">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-US") : "—"}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/traders/${u.id}`} className="text-sky-400 hover:underline">
                    {i18n("crm.ui.profile")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
