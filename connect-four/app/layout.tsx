import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '4 in a Row - Multiplayer Game',
  description: 'Real-time multiplayer Connect Four game',
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