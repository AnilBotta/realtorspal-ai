import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RealtorsPal AI CRM - Turn Leads into Appointments Automatically",
  description: "AI-powered CRM for real estate teams. Engage new leads in seconds, answer questions, qualify, and book showings automatically—24/7.",
  keywords: "real estate CRM, AI CRM, lead management, real estate automation, lead nurturing",
  authors: [{ name: "RealtorsPal" }],
  openGraph: {
    title: "RealtorsPal AI CRM - Turn Leads into Appointments Automatically",
    description: "Engage new leads in seconds, answer questions, qualify, and book showings automatically—24/7.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  )
}