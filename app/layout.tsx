import type { Metadata } from 'next';
import { Inter } from "next/font/google"
import './globals.css';


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400","500","600","700"]
})

export const metadata: Metadata = {
  title: 'AI Agent Workflow Management',
  description: 'Customize your agents workflow and schedule it according to your needs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.variable} antialiased bg-background`}>{children}</body>
    </html>
  );
}
