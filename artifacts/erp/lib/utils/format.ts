export function inr(n: number | string, dec = 2): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  const neg = num < 0;
  const abs = Math.abs(num);
  const [int, frac] = abs.toFixed(dec).split(".");
  let fmt = int.length <= 3 ? int
    : int.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,",") + "," + int.slice(-3);
  return (neg ? "(₹" : "₹") + fmt + (dec>0 ? "."+frac : "") + (neg ? ")" : "");
}
export function inrAbbr(n: number): string {
  const a = Math.abs(n);
  if (a>=10_000_000) return `₹${(n/10_000_000).toFixed(2)}Cr`;
  if (a>=100_000)    return `₹${(n/100_000).toFixed(1)}L`;
  if (a>=1_000)      return `₹${(n/1_000).toFixed(1)}K`;
  return inr(n,0);
}
export function fmtDate(d: Date | string): string {
  const dt = typeof d==="string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}).replace(/ /g,"-");
}
export function fyDates(): { from: string; to: string } {
  const now = new Date();
  const yr  = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear()-1;
  return { from: `${yr}-04-01`, to: `${yr+1}-03-31` };
}
