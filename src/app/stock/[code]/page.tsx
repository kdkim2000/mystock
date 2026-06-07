import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StockDetailClient } from '@/components/stock/stock-detail-client'

interface Props {
  params: { code: string }
}

export async function generateMetadata({ params }: Props) {
  return { title: `종목 ${params.code} | my-stock` }
}

export default async function StockDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  // 6자리 숫자 코드 유효성 검사
  if (!/^\d{6}$/.test(params.code)) redirect('/dashboard')

  return <StockDetailClient code={params.code} />
}
