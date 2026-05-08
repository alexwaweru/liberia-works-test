'use client'

import { useState } from 'react'
import { useMyPlacement, useConfirmPlacement } from '@/hooks/vacation-job'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Briefcase, CalendarDays, Building2, User } from 'lucide-react'

export default function VacationJobPage() {
  const { data: placement, isLoading, isError } = useMyPlacement()
  const mutation = useConfirmPlacement()
  const [code, setCode] = useState("")

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
  if (isError || !placement) return <div className="p-10 text-center">No placement found.</div>

  
  if (!placement.employer || !placement.cycle) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Placement information is loading or currently unavailable.</p>
        <p className="text-xs mt-2">Database records for this match are incomplete.</p>
      </div>
    )
  }
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="p-4 border rounded bg-card">
         <h2 className="font-bold">{(placement as any).employer?.companyName}</h2>
         <div className="mt-4 space-y-2">
            <div className="flex gap-2"><CalendarDays size={18}/> {(placement as any).cycle?.startDate ? new Date((placement as any).cycle.startDate).toLocaleDateString() : "N/A"}</div>
            <div className="flex gap-2"><User size={18}/> {(placement as any).employer?.primaryContactName}</div>
         </div>
      </div>
      
      {(placement as any).status === "MATCHED" && (
        <form onSubmit={async (e) => {
          e.preventDefault()
          await mutation.mutateAsync(code)
          toast.success("Confirmed!")
        }} className="p-4 border rounded">
          <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter 6-digit code" />
          <Button type="submit" className="mt-2">Confirm Placement</Button>
        </form>
      )}
    </div>
  )
}
