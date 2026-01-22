import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VC Waterfall Calculator",
  description: "Model liquidation preferences and exit scenarios for VC-backed startups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
