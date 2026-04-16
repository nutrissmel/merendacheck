import { PrismaClient, Papel, Plano, CategoriaChecklist, Frequencia, TipoResposta } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // 1. Criar Tenant
  const tenant = await prisma.tenant.upsert({
    where: { codigoIbge: '5212501' },
    update: {},
    create: {
      nome: 'Prefeitura Municipal de Luziânia',
      codigoIbge: '5212501',
      estado: 'GO',
      plano: Plano.MUNICIPAL,
    },
  })

  console.log(`Tenant criado: ${tenant.nome}`)

  // 2. Criar Escolas
  const escolasData = [
    { nome: 'EMEF João Paulo II', codigoInep: '52001001', numeroAlunos: 450, turnos: ['MATUTINO', 'VESPERTINO'] as any },
    { nome: 'EMEF Santos Dumont', codigoInep: '52001002', numeroAlunos: 320, turnos: ['MATUTINO', 'VESPERTINO'] as any },
    { nome: 'EMEI Criança Feliz', codigoInep: '52001003', numeroAlunos: 180, turnos: ['MATUTINO'] as any },
  ]

  const escolas = []
  for (const data of escolasData) {
    const escola = await prisma.escola.create({
      data: {
        ...data,
        tenantId: tenant.id,
      }
    })
    escolas.push(escola)
  }

  console.log(`${escolas.length} escolas criadas.`)

  // 3. Criar Usuários
  const usuariosData = [
    { email: 'admin@luziania.go.gov.br', nome: 'Secretária Maria Silva', papel: Papel.ADMIN_MUNICIPAL, supabaseUserId: 'user_admin_mock' },
    { email: 'nutri@luziania.go.gov.br', nome: 'Nutricionista Ana Costa', papel: Papel.NUTRICIONISTA, supabaseUserId: 'user_nutri_mock' },
    { email: 'diretor@emef1.luziania.go.gov.br', nome: 'Diretor João Pereira', papel: Papel.DIRETOR_ESCOLA, supabaseUserId: 'user_diretor_mock' },
    { email: 'merendeira1@luziania.go.gov.br', nome: 'Merendeira Rosa Santos', papel: Papel.MERENDEIRA, supabaseUserId: 'user_merendeira1_mock' },
    { email: 'merendeira2@luziania.go.gov.br', nome: 'Merendeira Conceição Lima', papel: Papel.MERENDEIRA, supabaseUserId: 'user_merendeira2_mock' },
  ]

  const usuarios = []
  for (const data of usuariosData) {
    const usuario = await prisma.usuario.create({
      data: {
        ...data,
        tenantId: tenant.id,
      }
    })
    usuarios.push(usuario)
  }

  console.log(`${usuarios.length} usuários criados.`)

  // 4. Atribuições
  await prisma.usuarioEscola.createMany({
    data: [
      { usuarioId: usuarios[3].id, escolaId: escolas[0].id },
      { usuarioId: usuarios[3].id, escolaId: escolas[1].id },
      { usuarioId: usuarios[4].id, escolaId: escolas[2].id },
      { usuarioId: usuarios[2].id, escolaId: escolas[0].id },
    ]
  })

  // 5. Checklists
  const checklists = [
    {
      nome: 'Controle de Temperatura',
      categoria: CategoriaChecklist.TEMPERATURA,
      frequencia: Frequencia.DIARIO,
      itens: [
        { ordem: 1, pergunta: 'A temperatura da câmara fria está entre 0°C e 5°C?', tipoResposta: TipoResposta.SIM_NAO, isCritico: true, fotoObrigatoria: true },
        { ordem: 2, pergunta: 'A temperatura do congelador está abaixo de -18°C?', tipoResposta: TipoResposta.SIM_NAO, isCritico: true },
        { ordem: 3, pergunta: 'O termômetro está calibrado e funcionando?', tipoResposta: TipoResposta.SIM_NAO },
        { ordem: 4, pergunta: 'Registre a temperatura atual da câmara fria', tipoResposta: TipoResposta.NUMERICO, valorMinimo: 0, valorMaximo: 5, unidade: '°C' },
        { ordem: 5, pergunta: 'Registre a temperatura atual do congelador', tipoResposta: TipoResposta.NUMERICO, valorMinimo: -25, valorMaximo: -18, unidade: '°C' },
      ]
    },
    {
      nome: 'Condições das Instalações',
      categoria: CategoriaChecklist.INSTALACOES,
      frequencia: Frequencia.SEMANAL,
      itens: [
        { ordem: 1, pergunta: 'A cozinha está limpa e organizada?', tipoResposta: TipoResposta.SIM_NAO, fotoObrigatoria: true },
        { ordem: 2, pergunta: 'O piso está limpo, seco e sem rachaduras?', tipoResposta: TipoResposta.SIM_NAO },
        { ordem: 3, pergunta: 'As pias têm sabão líquido e papel toalha?', tipoResposta: TipoResposta.SIM_NAO, isCritico: true },
      ]
    }
  ]

  for (const data of checklists) {
    await prisma.checklistModelo.create({
      data: {
        nome: data.nome,
        categoria: data.categoria,
        frequencia: data.frequencia,
        tenantId: tenant.id,
        isTemplate: true,
        itens: {
          create: data.itens
        }
      }
    })
  }

  console.log('Seed finalizado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
