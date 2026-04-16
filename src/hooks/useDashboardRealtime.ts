'use client'

import { useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'

interface UseDashboardRealtimeOptions {
  tenantId: string
  onNovaInspecao?: (escolaNome: string) => void
  onNovaNaoConformidade?: () => void
}

export function useDashboardRealtime({
  tenantId,
  onNovaInspecao,
  onNovaNaoConformidade,
}: UseDashboardRealtimeOptions) {
  const supabaseRef = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  useEffect(() => {
    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`dashboard-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inspecoes',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload: any) => {
          if (payload.new?.status === 'FINALIZADA' && payload.old?.status !== 'FINALIZADA') {
            onNovaInspecao?.('escola')
            toast.success('Nova inspeção registrada ✓', {
              description: 'Inspeção finalizada com sucesso',
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nao_conformidades',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          onNovaNaoConformidade?.()
          toast('Nova não conformidade registrada', {
            description: 'Uma nova NC foi adicionada ao sistema',
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, onNovaInspecao, onNovaNaoConformidade])
}
