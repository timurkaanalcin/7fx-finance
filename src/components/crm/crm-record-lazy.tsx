"use client";

import dynamic from "next/dynamic";

const load = () => import("@/components/crm/CrmRecordTable");

function TableFallback() {
  return <div className="h-16 rounded bg-neutral-100" role="status" aria-busy="true" />;
}

/** Table, forms, and confirm dialogs share one async chunk. */
const CrmRecordTable = dynamic(load, { loading: TableFallback });
export { CrmRecordTable };
export default CrmRecordTable;
export const ConfirmDialog = dynamic(() => load().then((m) => m.ConfirmDialog));
export const CrmFormGrid = dynamic(() => load().then((m) => m.CrmFormGrid), { loading: TableFallback });
export const ReflectBox = dynamic(() => load().then((m) => m.ReflectBox));
export const CrmAddForm = dynamic(() => load().then((m) => m.CrmAddForm), { loading: TableFallback });
