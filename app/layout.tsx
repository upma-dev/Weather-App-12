import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "WeatherApp — Your Personal Weather Intelligence",
  description: "Real-time weather with beautiful insights, built with Next.js and OpenWeatherMap",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(13,13,43,0.95)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              backdropFilter: "blur(20px)",
              fontFamily: "'Space Grotesk', sans-serif",
            },
            success: {
              iconTheme: { primary: "#00d4aa", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ff6b35", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
