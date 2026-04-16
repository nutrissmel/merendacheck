'use client'

import { useState } from 'react'
import { X, Smartphone, CheckCircle2, Copy, Loader2, ShieldCheck } from 'lucide-react'
import { iniciarSetup2FAAction, confirmar2FAAction } from '@/actions/configuracoes.actions'
import { toast } from 'sonner'
import Image from 'next/image'

interface Props {
  onClose: () => void
  onAtivado: () => void
}

type Passo = 'qr' | 'verificar' | 'codigos'

export function Modal2FA({ onClose, onAtivado }: Props) {
  const [passo, setPasso] = useState<Passo>('qr')
  const [carregando, setCarregando] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [codigoManual, setCodigoManual] = useState('')
  const [segredoTemp, setSegredoTemp] = useState('')
  const [codigoOtp, setCodigoOtp] = useState('')
  const [codigosRecuperacao, setCodigosRecuperacao] = useState<string[]>([])

  // Carregar QR code ao montar
  useState(() => {
    iniciarSetup2FAAction().then((res) => {
      if (res.sucesso) {
        setQrCodeUrl(res.qrCodeUrl)
        setCodigoManual(res.codigoManual)
        setSegredoTemp(res.segredoTemp)
      }
    })
  })

  async function handleVerificar() {
    if (codigoOtp.length !== 6) {
      toast.error('Digite o código de 6 dígitos')
      return
    }
    setCarregando(true)
    const res = await confirmar2FAAction(segredoTemp, codigoOtp)
    setCarregando(false)

    if (res.sucesso) {
      setCodigosRecuperacao(res.codigosRecuperacao)
      setPasso('codigos')
    } else {
      toast.error('erro' in res ? res.erro : 'Código inválido')
    }
  }

  function handleCopiarCodigos() {
    navigator.clipboard.writeText(codigosRecuperacao.join('\n'))
    toast.success('Códigos copiados!')
  }

  function handleConcluir() {
    onAtivado()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#D5E3F0]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#0E2E60]" />
              <h2 className="font-bold text-[#0F1B2D] font-heading">Ativar 2FA</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Indicador de passos */}
          <div className="flex items-center gap-2 px-6 py-3 bg-[#F5F9FD] border-b border-[#EEF4FD]">
            {(['qr', 'verificar', 'codigos'] as Passo[]).map((p, idx) => (
              <div key={p} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  passo === p ? 'bg-[#0E2E60] text-white' :
                  idx < ['qr', 'verificar', 'codigos'].indexOf(passo) ? 'bg-[#00963A] text-white' : 'bg-[#D5E3F0] text-[#5A7089]'
                }`}>
                  {idx < ['qr', 'verificar', 'codigos'].indexOf(passo) ? '✓' : idx + 1}
                </div>
                {idx < 2 && <div className="w-8 h-px bg-[#D5E3F0]" />}
              </div>
            ))}
            <span className="ml-2 text-xs text-[#5A7089]">
              {passo === 'qr' && 'Escanear QR Code'}
              {passo === 'verificar' && 'Verificar código'}
              {passo === 'codigos' && 'Códigos de recuperação'}
            </span>
          </div>

          <div className="px-6 py-5">
            {/* Passo 1: QR Code */}
            {passo === 'qr' && (
              <div className="space-y-4">
                <p className="text-sm text-[#5A7089]">
                  Escaneie o QR code abaixo com o <strong className="text-[#0F1B2D]">Google Authenticator</strong> ou <strong className="text-[#0F1B2D]">Authy</strong>.
                </p>

                <div className="flex justify-center">
                  {qrCodeUrl ? (
                    <div className="border-4 border-[#0E2E60] rounded-xl p-2">
                      <Image src={qrCodeUrl} alt="QR Code 2FA" width={180} height={180} unoptimized />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-[#EEF4FD] rounded-xl flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-[#0E2E60]" />
                    </div>
                  )}
                </div>

                {codigoManual && (
                  <div className="bg-[#F5F9FD] rounded-lg p-3">
                    <p className="text-[10px] text-[#5A7089] mb-1">Ou insira o código manualmente:</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-[#0E2E60] break-all">{codigoManual}</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(codigoManual); toast.success('Copiado!') }}
                        className="shrink-0 text-[#5A7089] hover:text-[#0E2E60]"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setPasso('verificar')}
                  disabled={!qrCodeUrl}
                  className="w-full py-2.5 rounded-lg bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors disabled:opacity-50"
                >
                  Já escanei → Verificar código
                </button>
              </div>
            )}

            {/* Passo 2: Verificar código */}
            {passo === 'verificar' && (
              <div className="space-y-4">
                <p className="text-sm text-[#5A7089]">
                  Digite o código de <strong className="text-[#0F1B2D]">6 dígitos</strong> exibido no seu app autenticador.
                </p>

                <div className="flex justify-center">
                  <Smartphone size={48} className="text-[#D5E3F0]" />
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codigoOtp}
                  onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full h-12 rounded-xl border-2 border-[#D5E3F0] px-4 text-center text-2xl font-mono tracking-widest text-[#0F1B2D] focus:outline-none focus:border-[#0E2E60]"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerificar() }}
                />

                <button
                  onClick={handleVerificar}
                  disabled={carregando || codigoOtp.length !== 6}
                  className="w-full py-2.5 rounded-lg bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {carregando ? <Loader2 size={14} className="animate-spin" /> : null}
                  Verificar e ativar 2FA
                </button>

                <button onClick={() => setPasso('qr')} className="w-full text-xs text-[#5A7089] hover:text-[#0E2E60]">
                  ← Voltar ao QR code
                </button>
              </div>
            )}

            {/* Passo 3: Códigos de recuperação */}
            {passo === 'codigos' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#00963A]">
                  <CheckCircle2 size={20} />
                  <span className="font-bold text-[#0F1B2D]">2FA ativado com sucesso!</span>
                </div>

                <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-xl p-4">
                  <p className="text-xs font-bold text-[#92400E] mb-1">⚠️ Guarde estes códigos em local seguro</p>
                  <p className="text-xs text-[#92400E]">Cada código só pode ser usado uma vez. Sem eles, você pode perder acesso à conta.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {codigosRecuperacao.map((codigo, i) => (
                    <div key={i} className="bg-[#F5F9FD] border border-[#D5E3F0] rounded-lg px-3 py-2 text-center">
                      <code className="text-sm font-mono text-[#0F1B2D] font-semibold tracking-wider">{codigo}</code>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCopiarCodigos}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#D5E3F0] text-sm text-[#0E2E60] font-semibold hover:bg-[#EEF4FD] transition-colors"
                >
                  <Copy size={13} />
                  Copiar todos os códigos
                </button>

                <button
                  onClick={handleConcluir}
                  className="w-full py-2.5 rounded-lg bg-[#00963A] text-white text-sm font-semibold hover:bg-[#007A30] transition-colors"
                >
                  Concluir configuração
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
