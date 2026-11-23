import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import { Inter } from "next/font/google";

const font = Inter({ subsets: ["latin"], variable: "--font" });

export const metadata = { title: "FloodSafe" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.variable}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
