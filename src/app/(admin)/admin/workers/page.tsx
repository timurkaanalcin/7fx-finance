"use client";

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
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setRows((d.users || []).filter((u: Row & { role: string }) => u.role === "ADMIN")))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Workers / Workers</h1>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Desk</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Permissions</th>
              <th className="px-3 py-2">Last login</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-neutral-200">
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2 text-neutral-500">{u.email}</td>
                <td className="px-3 py-2">{u.desk || "—"}</td>
                <td className="px-3 py-2">{u.active ? "Active" : "Closed"}</td>
                <td className="px-3 py-2 text-[9px] text-neutral-500">
                  {[
                    u.canManageUsers && "Users",
                    u.canApproveDeposits && "Deposits",
                    u.canEditRates && "Rates",
                    u.canManageMethods && "Methods",
                    u.canAdjustBalance && "Balance",
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
                <td className="px-3 py-2 text-[10px] text-neutral-500">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-US") : "—"}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/traders/${u.id}`} className="text-sky-400 hover:underline">
                    Profile
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
