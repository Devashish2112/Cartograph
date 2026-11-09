import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { themeBootScript } from "@/lib/theme";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cartograph",
  description: "Read a public GitHub repository as a dependency map.",
};

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--accent)",
    colorBackground: "var(--surface)",
    colorText: "var(--foreground)",
    colorInputBackground: "var(--surface-muted)",
    colorInputText: "var(--foreground)",
    borderRadius: "0.375rem",
    fontFamily: "var(--font-geist-sans)",
    fontSize: "0.8125rem",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <ThemeProvider>
          <ClerkProvider appearance={clerkAppearance}>
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
