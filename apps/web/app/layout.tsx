import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.scss";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"),
    title: { default: "Ur Home Taste | From Our Home to Yours", template: "%s | Ur Home Taste" },
    description: "Premium homemade Indian pickles prepared in small batches with traditional recipes.",
    openGraph: {
        title: "Ur Home Taste",
        description: "Authentic homemade pickles from our home to yours.",
        type: "website"
    },
    twitter: { card: "summary_large_image" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Header />
                <main>{children}</main>
                <Footer />
            </body>
        </html>
    );
}
