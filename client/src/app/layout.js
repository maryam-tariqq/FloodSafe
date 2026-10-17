import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import { Plus_Jakarta_Sans } from "next/font/google";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font" });

export const metadata = { title: "FloodSafe" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.variable}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
