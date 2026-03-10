import "./globals.css";
import { ResourceProvider } from "@rf/components/ResourceProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "Resource Framework Demo",
  description: "Demo and playground for the resource framework components"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark font-sans antialiased", geist.variable)}>
      <body>
        <ResourceProvider>{children}</ResourceProvider>
      </body>
    </html>
  );
}
