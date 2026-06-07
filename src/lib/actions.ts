'use server'
import { revalidatePath } from 'next/cache'

export async function revalidateDashboard() {
  revalidatePath('/dashboard')
}

export async function revalidateStock(code: string) {
  revalidatePath(`/stock/${code}`)
}
