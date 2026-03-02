import "./globals.css";
import { ResourceProvider } from "@rf/components/ResourceProvider";

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
    <html lang="en">
      <body>
        <ResourceProvider>{children}</ResourceProvider>
      </body>
    </html>
  );
}
