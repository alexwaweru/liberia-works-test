'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { verifyOtpAction, requestOtpAction } from './actions'

function VerifyOtpContent() {
  const params = useSearchParams()
  const phone = params.get('phone') ?? ''
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) {
      submit(next.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  async function submit(otp: string) {
    setVerifying(true)
    const result = await verifyOtpAction({ phone, otp })
    setVerifying(false)
    if (result?.error) {
      toast.error(result.error)
      setDigits(Array(6).fill(''))
      inputRefs.current[0]?.focus()
    }
  }

  async function handleResend() {
    setResending(true)
    const result = await requestOtpAction({ phone })
    setResending(false)
    if ('error' in result) toast.error(result.error)
    else toast.success('New OTP sent.')
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enter your verification code</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to <span className="font-medium text-foreground">{phone}</span>
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={verifying}
              className="w-11 h-12 rounded-lg border border-border text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow disabled:opacity-50"
            />
          ))}
        </div>

        <Button
          className="w-full"
          disabled={verifying || digits.join('').length < 6}
          onClick={() => submit(digits.join(''))}
        >
          {verifying ? 'Verifying…' : 'Verify'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive it?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-primary font-medium hover:underline disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpContent />
    </Suspense>
  )
}
