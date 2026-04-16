import { NobleCryptoPlugin, ScureBase32Plugin, TOTP, generateSecret } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'

const APP_NAME = 'MerendaCheck'

function createTOTP(): TOTP {
  return new TOTP({
    crypto: new NobleCryptoPlugin(),
    base32: new ScureBase32Plugin(),
  } as any)
}

// AES-256 encryption key from env
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY ?? 'merenda-check-dev-key-32-bytes!!'
  return Buffer.from(key.slice(0, 32).padEnd(32, '0'))
}

export function encryptarSegredo(segredo: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(segredo, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decryptarSegredo(encrypted: string): string {
  const [ivHex, encHex] = encrypted.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const enc = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export async function gerarConfiguracao2FA(params: {
  email: string
  municipio: string
}): Promise<{
  segredo: string
  segredoCriptografado: string
  qrCodeUrl: string
  codigoManual: string
}> {
  const totp = createTOTP()
  const segredo = generateSecret()
  // toURI: { label, issuer, secret }
  const otpAuthUrl = (totp as any).toURI({ label: params.email, issuer: `${APP_NAME} (${params.municipio})`, secret: segredo })
  const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl)

  return {
    segredo,
    segredoCriptografado: encryptarSegredo(segredo),
    qrCodeUrl,
    codigoManual: segredo,
  }
}

export async function verificarCodigo2FA(segredoCriptografado: string, codigo: string): Promise<boolean> {
  try {
    const totp = createTOTP()
    const segredo = decryptarSegredo(segredoCriptografado)
    const result = await (totp as any).verify(codigo, { secret: segredo }) as { valid: boolean }
    return result?.valid === true
  } catch {
    return false
  }
}

export function gerarCodigosRecuperacao(): string[] {
  return Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase().replace(/(.{4})(.{4})/, '$1-$2'),
  )
}

export function hashearCodigosRecuperacao(codigos: string[]): string[] {
  return codigos.map((c) =>
    crypto.createHash('sha256').update(c.replace('-', '')).digest('hex'),
  )
}

export function verificarCodigoRecuperacao(codigo: string, hashes: string[]): boolean {
  const hash = crypto.createHash('sha256').update(codigo.replace('-', '').toUpperCase()).digest('hex')
  return hashes.includes(hash)
}
