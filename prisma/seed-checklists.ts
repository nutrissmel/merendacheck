import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Busca o primeiro tenant ativo
  const tenant = await prisma.tenant.findFirst({ where: { ativo: true } })
  if (!tenant) throw new Error('Nenhum tenant encontrado')
  console.log(`✓ Tenant: ${tenant.nome} (${tenant.id})`)

  // Checklists já existentes
  const existentes = await prisma.checklistModelo.findMany({
    where: { tenantId: tenant.id },
    select: { nome: true },
  })
  const nomesExistentes = new Set(existentes.map((c) => c.nome.toLowerCase().trim()))
  console.log(`✓ Checklists existentes: ${[...nomesExistentes].join(', ') || 'nenhum'}`)

  // ─── Definição dos novos modelos ─────────────────────────────────────────────

  const modelos = [
    {
      nome: 'Higiene Pessoal dos Manipuladores',
      descricao: 'Verificação das condições de higiene pessoal dos manipuladores de alimentos conforme RDC 216/2004.',
      categoria: 'HIGIENE_PESSOAL' as const,
      frequencia: 'DIARIO' as const,
      itens: [
        { pergunta: 'Os manipuladores estão com uniformes limpos e completos?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.0 },
        { pergunta: 'Estão usando touca ou proteção para os cabelos?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0 },
        { pergunta: 'Ausência de adornos (anéis, brincos, relógio, pulseira)?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0 },
        { pergunta: 'As mãos estão higienizadas corretamente antes do preparo?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 3.0 },
        { pergunta: 'Ausência de esmalte ou unhas longas/sujas?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.5 },
        { pergunta: 'Manipuladores sem sintomas de doenças (tosse, resfriado, lesões)?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 3.0 },
        { pergunta: 'Avaliação geral das condições de higiene pessoal', tipoResposta: 'ESCALA' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: false, peso: 1.0, valorMinimo: 1, valorMaximo: 5 },
      ],
    },
    {
      nome: 'Recebimento de Gêneros Alimentícios',
      descricao: 'Controle do recebimento de alimentos verificando procedência, validade, temperatura e condições das embalagens.',
      categoria: 'RECEBIMENTO_GENEROS' as const,
      frequencia: 'SOB_DEMANDA' as const,
      itens: [
        { pergunta: 'O fornecedor apresentou documentação fiscal (nota fiscal)?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0 },
        { pergunta: 'Veículo de entrega em boas condições de higiene?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: true, obrigatorio: true, peso: 1.0 },
        { pergunta: 'Embalagens íntegras, sem amassados, estufamentos ou avarias?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0 },
        { pergunta: 'Todos os produtos estão dentro do prazo de validade?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 3.0 },
        { pergunta: 'Rótulos com identificação completa (ingredientes, lote, fabricante)?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.0 },
        { pergunta: 'Temperatura dos refrigerados no recebimento (máx. 10°C)', tipoResposta: 'NUMERICO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0, valorMinimo: -30, valorMaximo: 60, unidade: '°C' },
        { pergunta: 'Temperatura dos congelados no recebimento (máx. -12°C)', tipoResposta: 'NUMERICO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: false, peso: 2.0, valorMinimo: -50, valorMaximo: 0, unidade: '°C' },
        { pergunta: 'Características sensoriais aprovadas (cor, odor, textura adequados)?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0 },
        { pergunta: 'Quantidade recebida confere com o pedido?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.0 },
        { pergunta: 'Registro fotográfico do recebimento', tipoResposta: 'FOTO' as const, isCritico: false, fotoObrigatoria: true, obrigatorio: false, peso: 1.0 },
      ],
    },
    {
      nome: 'Higienização de Utensílios e Superfícies',
      descricao: 'Verificação dos procedimentos de limpeza e desinfecção de utensílios, equipamentos e superfícies de contato com alimentos.',
      categoria: 'HIGIENIZACAO_UTENSILIOS' as const,
      frequencia: 'DIARIO' as const,
      itens: [
        { pergunta: 'Utensílios lavados com detergente neutro e enxaguados adequadamente?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0 },
        { pergunta: 'Utensílios desinfetados com solução clorada ou equivalente?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0 },
        { pergunta: 'Utensílios armazenados protegidos de contaminação?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.0 },
        { pergunta: 'Superfícies de preparo higienizadas antes e após o uso?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0 },
        { pergunta: 'Tabuas de corte limpas e sem odores?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.5 },
        { pergunta: 'Panos e esponjas substituídos regularmente (máx. diário)?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.0 },
        { pergunta: 'Lixeiras com tampa e acionamento por pedal?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.0 },
        { pergunta: 'Lixo removido com frequência adequada durante o preparo?', tipoResposta: 'SIM_NAO' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.0 },
        { pergunta: 'Área de higienização separada da área de preparo?', tipoResposta: 'SIM_NAO' as const, isCritico: true, fotoObrigatoria: false, obrigatorio: true, peso: 2.0 },
        { pergunta: 'Avaliação geral da limpeza da cozinha', tipoResposta: 'ESCALA' as const, isCritico: false, fotoObrigatoria: false, obrigatorio: true, peso: 1.0, valorMinimo: 1, valorMaximo: 5 },
      ],
    },
  ]

  // ─── Criar apenas os que não existem ─────────────────────────────────────────

  let criados = 0
  let pulados = 0

  for (const modelo of modelos) {
    const nomeNorm = modelo.nome.toLowerCase().trim()
    if (nomesExistentes.has(nomeNorm)) {
      console.log(`⏭  Pulando (já existe): ${modelo.nome}`)
      pulados++
      continue
    }

    await prisma.checklistModelo.create({
      data: {
        tenantId: tenant.id,
        nome: modelo.nome,
        descricao: modelo.descricao,
        categoria: modelo.categoria,
        frequencia: modelo.frequencia,
        ativo: true,
        isTemplate: false,
        itens: {
          create: modelo.itens.map((item: any, idx: number) => ({
            ordem: idx + 1,
            pergunta: item.pergunta,
            tipoResposta: item.tipoResposta,
            isCritico: item.isCritico,
            fotoObrigatoria: item.fotoObrigatoria,
            obrigatorio: item.obrigatorio,
            peso: item.peso,
            valorMinimo: item.valorMinimo ?? null,
            valorMaximo: item.valorMaximo ?? null,
            unidade: item.unidade ?? null,
            opcoes: [],
          })),
        },
      },
    })

    console.log(`✅ Criado: ${modelo.nome} (${modelo.itens.length} itens)`)
    criados++
  }

  console.log(`\n🎉 Concluído! ${criados} criados, ${pulados} pulados.`)
}

main()
  .catch((e) => { console.error('❌ Erro:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
