import App from '@intrinsiq/ui/App'
import { cn } from '@intrinsiq/ui/cn'
import '@intrinsiq/ui/tokens.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'INTRINSIQ Portfolio',
    template: '%s · INTRINSIQ Portfolio',
  },
  description: 'Fund and portfolio company performance for investment managers.',
}

const RootLayout = ({ children }: LayoutProps<'/'>) => {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable)}>
      <body>
        <App brand={<Link href="/">Intrinsiq</Link>}>{children}</App>
      </body>
    </html>
  )
}

export default RootLayout
