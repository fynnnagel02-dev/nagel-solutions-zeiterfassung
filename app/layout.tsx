import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nagel Solutions Zeiterfassung",
  description: "Professionelle Zeiterfassung, Freigaben und Abwesenheiten für kleine Einsatzteams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
