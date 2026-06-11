import { Suspense } from 'react'
import { SignInContent } from '@/components/auth/sign-in-content'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense>
        <SignInContent />
      </Suspense>
    </div>
  )
}
