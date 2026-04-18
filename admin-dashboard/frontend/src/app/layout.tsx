import type { Metadata } from "next";
import "./style.css";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "Interview AI Admin",
  description: "Administrative dashboard for Interview AI Mobile App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
