import { buscarDadosBillingSuperAdmin } from '@/actions/super-admin.actions'
import { BillingClient } from '@/components/super-admin/BillingClient'

export default async function BillingPage() {
  const data = await buscarDadosBillingSuperAdmin()
  return <BillingClient {...data} />
}
