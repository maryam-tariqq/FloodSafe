import "./globals.css";
import { AppProvider } from "@/lib/AppContext";

export const metadata = { title: "FloodSafe" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
