import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'inspections'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function garantirBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const inspecaoId = formData.get('inspecaoId') as string | null
    const itemId = formData.get('itemId') as string | null

    if (!file || !inspecaoId || !itemId) {
      return NextResponse.json({ erro: 'Dados obrigatórios ausentes' }, { status: 400 })
    }

    await garantirBucket()

    const ext = file.type.split('/')[1] ?? 'jpg'
    const path = `${user.tenantId}/${inspecaoId}/${itemId}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error('[sync/foto] storage error:', error.message)
      return NextResponse.json({ erro: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)

    return NextResponse.json({ fotoUrl: publicUrl })
  } catch (err) {
    console.error('[sync/foto]', err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
