import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Castlr — Live Audio Broadcasting",
  description: "Create your radio station. Broadcast live audio to listeners anywhere.",
  openGraph: {
    title: "Castlr",
    description: "Live audio broadcasting platform",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-zinc-950 text-zinc-50`}>
        {children}
      </body>
    </html>
  );
}
