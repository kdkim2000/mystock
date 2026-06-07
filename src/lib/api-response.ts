import { NextResponse } from 'next/server'

export function ok<T>(data: T, cachedAt?: string) {
  return NextResponse.json({ data, ...(cachedAt && { cachedAt }) })
}

export function err(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status })
}
