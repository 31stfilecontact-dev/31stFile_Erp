import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "31st File ERP",
  description: "UPI capture · Manual entries · P&L · Balance Sheet · Trial Balance",
  icons: { icon: "https://lottie.host/5946a287-9a8e-40b9-bae6-e948b9e33e8f/kbYxf8zkUw.png" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
