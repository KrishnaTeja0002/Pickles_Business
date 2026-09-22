import type { Metadata } from "next";
import { Providers } from "./providers";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.scss";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"),
    title: { default: "Ur Home Taste | Premium Homemade Andhra Pickles", template: "%s | Ur Home Taste" },
    description: "Authentic Andhra style handmade pickles. Small-batch Avakaya, Gongura, Chicken, and more — made with traditional recipes and cold-pressed oils.",
    keywords: ["andhra pickle", "homemade pickle", "avakaya", "gongura", "pachallu", "telugu pickle", "indian pickle online"],
    openGraph: {
        title: "Ur Home Taste — From Our Home to Yours",
        description: "Authentic homemade Andhra pickles made in small batches with seasonal produce and family recipes.",
        type: "website",
        siteName: "Ur Home Taste",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </head>
            <body>
                <Providers>
                    <Header />
                    <main>{children}</main>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}
