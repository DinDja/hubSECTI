import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SiteLoader } from '@/components/site-loader'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'Hub SECTI | Sistemas Integrados',
  description: 'Plataforma central de acesso aos sistemas e ferramentas da Secretaria de Ciência, Tecnologia e Inovação da Bahia',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/',
        type: 'image/svg+xml',
      },
    ],
    apple: '/',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SiteLoader />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
