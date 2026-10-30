import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import TubesBackground from "@/components/TubesBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "YouTube Watch Party",
  description: "Real-time synchronized YouTube watch parties with friends",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-transparent text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
        <Providers>
          <TubesBackground>{children}</TubesBackground>
        </Providers>
      </body>
    </html>
  );
}
