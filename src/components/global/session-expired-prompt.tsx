'use client'
import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function SessionExpiredPrompt() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const res = await originalFetch(...args)
      if (res.status === 401) {
        setOpen(true)
      }
      return res
    }
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>세션이 만료되었습니다</DialogTitle>
          <DialogDescription>
            보안을 위해 자동으로 로그아웃되었습니다. 다시 로그인해주세요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() =>
              signIn('google', { callbackUrl: window.location.href })
            }
          >
            다시 로그인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
