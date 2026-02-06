import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppForger - Generate Mobile & Web Apps",
  description: "Create Expo React Native mobile apps and Next.js web companions with one click",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
