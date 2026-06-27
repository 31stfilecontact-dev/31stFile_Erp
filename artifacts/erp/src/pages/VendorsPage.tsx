import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Vendor = {
  id: string;
  name: string;
  displayName: string | null;
  gstNo: string | null;
  pan: string | null;
  category: string | null;
  tdsApplicable: boolean;
  defaultAccountId: string | null;
};

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  
  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["vendors", search],
    queryFn: async () => {
      const res = await fetch(`/api/vendors?q=${search}`);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    }
  });

  return (
    <div className="flex-1 p-8 bg-zinc-50 dark:bg-zinc-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Vendors</h1>
            <p className="text-zinc-500 mt-1">Manage suppliers, contractors, and parties.</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Vendor
          </button>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400">search</span>
            <input 
              type="text" 
              placeholder="Search by name or GST..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">Loading vendors...</div>
          ) : vendors?.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <span className="material-symbols-outlined text-4xl mb-3 text-zinc-300">group_off</span>
              <p>No vendors found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-sm font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">GST No.</th>
                  <th className="px-6 py-3">PAN</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {vendors?.map(v => (
                  <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{v.name}</div>
                      {v.tdsApplicable && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">TDS Applicable</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-zinc-600 dark:text-zinc-400">{v.gstNo || '-'}</td>
                    <td className="px-6 py-4 text-sm font-mono text-zinc-600 dark:text-zinc-400">{v.pan || '-'}</td>
                    <td className="px-6 py-4 text-sm capitalize text-zinc-600 dark:text-zinc-400">{v.category || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
