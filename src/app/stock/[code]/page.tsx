import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StockDetailClient } from '@/components/stock/stock-detail-client'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props) {
  const { code } = await params
  return { title: `종목 ${code} | my-stock` }
}

export default async function StockDetailPage({ params }: Props) {
  const { code } = await params

  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  // 6자리 숫자 코드 유효성 검사
  if (!/^\d{6}$/.test(code)) redirect('/dashboard')

  return <StockDetailClient code={code} />
}
