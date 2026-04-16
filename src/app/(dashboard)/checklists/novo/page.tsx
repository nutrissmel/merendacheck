import { listarChecklists } from '@/actions/checklist.actions'
import { NovoChecklistClient } from './NovoChecklistClient'

export default async function NovoChecklistPage() {
  const templates = await listarChecklists({ apenasTemplates: true, ativo: true })
  return <NovoChecklistClient templates={templates} />
}
