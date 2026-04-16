'use client'

import { useState } from 'react'
import { Shield, Monitor, Smartphone, LogOut, Loader2, ShieldCheck, ShieldOff, ChevronRight } from 'lucide-react'
import { encerrarTodasSessoesAction, desativar2FAAction } from '@/actions/configuracoes.actions'
import { Modal2FA } from './Modal2FA'
import { toast } from 'sonner'

interface Props {
  usuario2FAAtivo: boolean
  logAcessos: Array<{
    acao: string
    ip: string | null
    userAgent: string | null
    createdAt: Date
  }>
}

export function SecaoSeguranca({ usuario2FAAtivo, logAcessos }: Props) {
  const [modal2FA, setModal2FA] = useState(false)
  const [twoFAAtivo, setTwoFAAtivo] = useState(usuario2FAAtivo)
  const [encerrando, setEncerrando] = useState(false)
  const [desativando2FA, setDesativando2FA] = useState(false)

  async function handleEncerrarTodas() {
    if (!confirm('Encerrar todas as outras sessões ativas?')) return
    setEncerrando(true)
    const res = await encerrarTodasSessoesAction()
    setEncerrando(false)
    if (res.sucesso) {
      toast.success('Todas as outras sessões foram encerradas')
    } else {
      toast.error('Erro ao encerrar sessões')
    }
  }

  async function handleDesativar2FA() {
    if (!confirm('Desativar autenticação de dois fatores? Sua conta ficará menos segura.')) return
    setDesativando2FA(true)
    const res = await desativar2FAAction()
    setDesativando2FA(false)
    if (res.sucesso) {
      setTwoFAAtivo(false)
      toast.success('2FA desativado')
    } else {
      toast.error(res.erro ?? 'Erro ao desativar 2FA')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-[#0F1B2D] font-heading flex items-center gap-2">
          <Shield size={16} className="text-[#0E2E60]" />
          Segurança
        </h2>
        <p className="text-sm text-[#5A7089] mt-0.5">Gerencie sessões ativas e autenticação de dois fatores</p>
      </div>

      {/* Sessões ativas */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EEF4FD] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F1B2D]">Sessões ativas</h3>
          <button
            onClick={handleEncerrarTodas}
            disabled={encerrando}
            className="flex items-center gap-1 text-xs text-[#DC2626] font-semibold hover:underline disabled:opacity-50"
          >
            {encerrando ? <Loader2 size={10} className="animate-spin" /> : <LogOut size={10} />}
            Encerrar todas as outras
          </button>
        </div>
        <div className="divide-y divide-[#EEF4FD]">
          {/* Sessão atual sempre mostrada */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-[#EEF4FD] flex items-center justify-center shrink-0">
              <Monitor size={14} className="text-[#0E2E60]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0F1B2D]">Esta sessão</p>
              <p className="text-xs text-[#5A7089]">Navegador atual</p>
            </div>
            <span className="text-[10px] font-bold text-[#00963A] bg-[#D1F7E2] px-2 py-0.5 rounded-full">Atual</span>
          </div>

          {logAcessos.slice(1, 3).map((log, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5F9FD] flex items-center justify-center shrink-0">
                {log.userAgent?.toLowerCase().includes('android') || log.userAgent?.toLowerCase().includes('iphone')
                  ? <Smartphone size={14} className="text-[#5A7089]" />
                  : <Monitor size={14} className="text-[#5A7089]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#0F1B2D] truncate">
                  {log.userAgent ? parseUA(log.userAgent) : 'Dispositivo desconhecido'}
                </p>
                <p className="text-xs text-[#5A7089]">
                  {log.ip ?? '—'} · {formatRelative(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EEF4FD]">
          <h3 className="text-sm font-bold text-[#0F1B2D]">Autenticação de dois fatores (2FA)</h3>
        </div>
        <div className="px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${twoFAAtivo ? 'bg-[#D1F7E2]' : 'bg-[#EEF4FD]'}`}>
              {twoFAAtivo
                ? <ShieldCheck size={16} className="text-[#00963A]" />
                : <ShieldOff size={16} className="text-[#5A7089]" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F1B2D]">
                {twoFAAtivo ? '2FA ativo' : '2FA inativo'}
              </p>
              <p className="text-xs text-[#5A7089]">
                {twoFAAtivo
                  ? 'Sua conta está protegida com autenticação de dois fatores'
                  : 'Ative para proteger sua conta com um app autenticador'
                }
              </p>
            </div>
          </div>

          {twoFAAtivo ? (
            <button
              onClick={handleDesativar2FA}
              disabled={desativando2FA}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs text-[#DC2626] font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {desativando2FA ? <Loader2 size={11} className="animate-spin" /> : null}
              Desativar
            </button>
          ) : (
            <button
              onClick={() => setModal2FA(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E2E60] text-white text-xs font-semibold hover:bg-[#133878] transition-colors"
            >
              Ativar 2FA
              <ChevronRight size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Log de acessos */}
      {logAcessos.length > 0 && (
        <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EEF4FD]">
            <h3 className="text-sm font-bold text-[#0F1B2D]">Últimos acessos</h3>
          </div>
          <div className="divide-y divide-[#EEF4FD]">
            {logAcessos.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-xs text-[#0F1B2D]">
                    {log.userAgent ? parseUA(log.userAgent) : 'Dispositivo desconhecido'}
                  </p>
                  <p className="text-[11px] text-[#A8BDD4]">{log.ip ?? '—'}</p>
                </div>
                <span className="text-[11px] text-[#5A7089]">
                  {new Date(log.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal2FA && (
        <Modal2FA
          onClose={() => setModal2FA(false)}
          onAtivado={() => setTwoFAAtivo(true)}
        />
      )}
    </div>
  )
}

function parseUA(ua: string): string {
  if (ua.includes('Android')) return 'Android — Chrome'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS — Safari'
  if (ua.includes('Firefox')) return 'Firefox — Windows'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari — macOS'
  return 'Chrome — Windows'
}

function formatRelative(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(hours / 24)}d`
}
