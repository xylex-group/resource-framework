import "@/*/globals.css";
import { ResourceProvider } from "@xylex-group/resource-framework/components/ResourceProvider";

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
