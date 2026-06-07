import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { ThemeProvider } from 'next-themes'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/global/session-provider'
import { SessionExpiredPrompt } from '@/components/global/session-expired-prompt'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'my-stock',
  description: '개인 한국 주식 투자 대시보드',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider session={session}>
            <Providers>
              {children}
              <Toaster />
              <SessionExpiredPrompt />
            </Providers>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
