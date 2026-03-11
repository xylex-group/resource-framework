import "./globals.css";
import { ResourceProvider } from "@rf/components/ResourceProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Resource Framework Demo",
  description: "Demo and playground for the resource framework components",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans antialiased", geist.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ResourceProvider>
            <div className="fixed right-4 top-4 z-50">
              <ThemeToggle />
            </div>
            {children}
          </ResourceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
