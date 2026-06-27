import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function MastersPage() {
  const [tab, setTab] = useState<"hsn" | "tds">("hsn");

  const { data: hsnCodes, isLoading: hsnLoading } = useQuery({
    queryKey: ["hsn"],
    queryFn: async () => {
      const res = await fetch("/api/masters/hsn");
      if (!res.ok) throw new Error("Failed to load HSN codes");
      return res.json();
    }
  });

  const { data: tdsSections, isLoading: tdsLoading } = useQuery({
    queryKey: ["tds"],
    queryFn: async () => {
      const res = await fetch("/api/masters/tds");
      if (!res.ok) throw new Error("Failed to load TDS sections");
      return res.json();
    }
  });

  return (
    <div className="flex-1 p-8 bg-zinc-50 dark:bg-zinc-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Tax Masters</h1>
          <p className="text-zinc-500 mt-1">Manage HSN/SAC codes and TDS sections.</p>
        </div>

        <div className="flex space-x-1 bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-lg w-max">
          <button 
            className={`px-6 py-2 rounded-md font-medium transition-colors ${tab === "hsn" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
            onClick={() => setTab("hsn")}
          >
            HSN / SAC Codes
          </button>
          <button 
            className={`px-6 py-2 rounded-md font-medium transition-colors ${tab === "tds" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
            onClick={() => setTab("tds")}
          >
            TDS Sections
          </button>
        </div>

        {tab === "hsn" && (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {hsnLoading ? <div className="p-8 text-center text-zinc-500">Loading...</div> : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-sm font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">IGST Rate</th>
                    <th className="px-6 py-3">CGST / SGST</th>
                    <th className="px-6 py-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {hsnCodes?.map((code: any) => (
                    <tr key={code.code} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-6 py-4 font-mono text-zinc-900 dark:text-zinc-100">{code.code}</td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{code.description}</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{code.igstRate}%</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{code.cgstRate}% / {code.sgstRate}%</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{code.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "tds" && (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {tdsLoading ? <div className="p-8 text-center text-zinc-500">Loading...</div> : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-sm font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-6 py-3">Section</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Ind. Rate</th>
                    <th className="px-6 py-3">Co. Rate</th>
                    <th className="px-6 py-3">Thresholds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {tdsSections?.map((sec: any) => (
                    <tr key={sec.code} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">{sec.code}</td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{sec.description}</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{sec.individualRate}%</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{sec.companyRate}%</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-sm">
                        {sec.thresholdSingle ? <div>Single: ₹{Number(sec.thresholdSingle).toLocaleString()}</div> : null}
                        {sec.thresholdAggregate ? <div>Aggregate: ₹{Number(sec.thresholdAggregate).toLocaleString()}</div> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
