'use client'
import { useSearchParams } from 'next/navigation'
import { LoginCard } from './login-card'
import { AuthErrorMessage } from './auth-error-message'

export function SignInContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="w-full max-w-sm space-y-4">
      {error && <AuthErrorMessage error={error} />}
      <LoginCard />
    </div>
  )
}
