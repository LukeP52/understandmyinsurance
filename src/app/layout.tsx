import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Understand My Insurance',
  description: 'Your guide to understanding insurance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}