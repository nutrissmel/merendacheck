'use client'

import { useState } from 'react'
import { Zap, Eye, EyeOff, Copy, RefreshCw, Save, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import {
  regenerarApiKeyAction,
  salvarWebhookAction,
  testarWebhookAction,
} from '@/actions/configuracoes.actions'
import { toast } from 'sonner'
import type { DadosTenant } from '@/actions/configuracoes.actions'

const EVENTOS_WEBHOOK = [
  { value: 'inspecao_finalizada', label: 'Nova inspeção finalizada' },
  { value: 'nc_gerada', label: 'NC gerada' },
  { value: 'nc_resolvida', label: 'NC resolvida' },
  { value: 'score_alterado', label: 'Score alterado' },
]

interface Props {
  tenant: DadosTenant
}

export function SecaoIntegracoes({ tenant }: Props) {
  const [apiKey, setApiKey] = useState(tenant.apiKey ?? '')
  const [revelado, setRevelado] = useState(false)
  const [regenerando, setRegenerando] = useState(false)

  const [webhookUrl, setWebhookUrl] = useState(tenant.webhookUrl ?? '')
  const [eventos, setEventos] = useState<string[]>(tenant.webhookEventos)
  const [salvandoWebhook, setSalvandoWebhook] = useState(false)
  const [testando, setTestando] = useState(false)
  const [resultadoTeste, setResultadoTeste] = useState<{ statusCode: number; resposta: string } | null>(null)

  // API Key mascarada
  const apiKeyMascarada = apiKey
    ? apiKey.slice(0, 10) + '••••••••••••••••••••' + apiKey.slice(-6)
    : '—'

  async function handleRegenerarKey() {
    if (apiKey && !confirm('Regenerar invalidará a chave atual imediatamente. Continuar?')) return
    setRegenerando(true)
    const res = await regenerarApiKeyAction()
    setRegenerando(false)
    if (res.sucesso) {
      setApiKey(res.apiKey)
      setRevelado(true)
      toast.success('API Key gerada!')
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao gerar key')
    }
  }

  function handleCopiarKey() {
    navigator.clipboard.writeText(apiKey)
    toast.success('API Key copiada!')
  }

  function toggleEvento(valor: string) {
    setEventos((prev) =>
      prev.includes(valor) ? prev.filter((e) => e !== valor) : [...prev, valor],
    )
  }

  async function handleSalvarWebhook() {
    if (!webhookUrl) { toast.error('Informe a URL do webhook'); return }
    if (!webhookUrl.startsWith('https://')) { toast.error('URL deve usar HTTPS'); return }
    if (eventos.length === 0) { toast.error('Selecione pelo menos um evento'); return }

    setSalvandoWebhook(true)
    const res = await salvarWebhookAction({ url: webhookUrl, eventos })
    setSalvandoWebhook(false)
    if (res.sucesso) {
      toast.success('Webhook salvo ✓')
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao salvar webhook')
    }
  }

  async function handleTestarWebhook() {
    setTestando(true)
    setResultadoTeste(null)
    const res = await testarWebhookAction()
    setTestando(false)
    if (res.sucesso) {
      setResultadoTeste({ statusCode: res.statusCode, resposta: res.resposta })
      if (res.statusCode >= 200 && res.statusCode < 300) {
        toast.success(`Webhook respondeu com status ${res.statusCode}`)
      } else {
        toast.error(`Webhook retornou status ${res.statusCode}`)
      }
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao testar webhook')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-[#0F1B2D] font-heading flex items-center gap-2">
          <Zap size={16} className="text-[#0E2E60]" />
          Integrações
        </h2>
        <p className="text-sm text-[#5A7089] mt-0.5">API key e webhooks para integrar com sistemas externos</p>
      </div>

      {/* API Key */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EEF4FD]">
          <h3 className="text-sm font-bold text-[#0F1B2D]">API Key</h3>
          <p className="text-xs text-[#5A7089] mt-0.5">Use para autenticar requisições à API do MerendaCheck</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          {apiKey ? (
            <div className="flex items-center gap-2 bg-[#F5F9FD] rounded-lg px-3 py-2.5 border border-[#D5E3F0]">
              <code className="flex-1 text-sm font-mono text-[#0F1B2D] break-all">
                {revelado ? apiKey : apiKeyMascarada}
              </code>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setRevelado(!revelado)}
                  className="p-1 text-[#5A7089] hover:text-[#0E2E60] transition-colors"
                  title={revelado ? 'Ocultar' : 'Revelar'}
                >
                  {revelado ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={handleCopiarKey}
                  className="p-1 text-[#5A7089] hover:text-[#0E2E60] transition-colors"
                  title="Copiar"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#A8BDD4]">Nenhuma API key gerada ainda</p>
          )}

          {apiKey && (
            <div className="flex items-center gap-2 text-xs text-[#F59E0B] bg-[#FEF3C7] rounded-lg px-3 py-2">
              ⚠️ Regenerar invalida a chave anterior imediatamente
            </div>
          )}

          <button
            onClick={handleRegenerarKey}
            disabled={regenerando}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5E3F0] text-sm text-[#0E2E60] font-semibold hover:bg-[#EEF4FD] transition-colors disabled:opacity-50"
          >
            {regenerando ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {apiKey ? 'Regenerar API Key' : 'Gerar API Key'}
          </button>
        </div>
      </div>

      {/* Webhook */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EEF4FD]">
          <h3 className="text-sm font-bold text-[#0F1B2D]">Webhook</h3>
          <p className="text-xs text-[#5A7089] mt-0.5">Receba eventos do MerendaCheck no seu sistema</p>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">URL do webhook (HTTPS obrigatório)</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://sistema.prefeitura.com.br/webhook"
              className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5A7089] block mb-2">Eventos a enviar</label>
            <div className="space-y-2">
              {EVENTOS_WEBHOOK.map((ev) => (
                <label key={ev.value} className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => toggleEvento(ev.value)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      eventos.includes(ev.value)
                        ? 'bg-[#0E2E60] border-[#0E2E60]'
                        : 'border-[#D5E3F0]'
                    }`}
                  >
                    {eventos.includes(ev.value) && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#0F1B2D]">{ev.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Resultado do teste */}
          {resultadoTeste && (
            <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
              resultadoTeste.statusCode >= 200 && resultadoTeste.statusCode < 300
                ? 'bg-[#D1F7E2] text-[#00963A]'
                : 'bg-[#FEE2E2] text-[#DC2626]'
            }`}>
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Status {resultadoTeste.statusCode}</span>
                {resultadoTeste.resposta && (
                  <p className="text-xs mt-0.5 opacity-80">{resultadoTeste.resposta}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestarWebhook}
              disabled={testando || !tenant.webhookUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5E3F0] text-sm text-[#5A7089] font-semibold hover:bg-[#F5F9FD] transition-colors disabled:opacity-50"
            >
              {testando ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              Testar webhook
            </button>
            <button
              onClick={handleSalvarWebhook}
              disabled={salvandoWebhook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors disabled:opacity-50"
            >
              {salvandoWebhook ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Documentação */}
      <div className="bg-[#EEF4FD] rounded-xl p-4">
        <p className="text-xs font-bold text-[#0E2E60] uppercase tracking-wider mb-2">Documentação da API</p>
        <p className="text-sm text-[#5A7089] mb-3">
          Consulte a documentação completa para integrar o MerendaCheck ao seu ERP ou sistema de gestão municipal.
        </p>
        <a
          href="/docs/api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[#0E2E60] font-semibold hover:underline"
        >
          Ver documentação da API
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}
