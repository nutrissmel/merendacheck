/**
 * Comprimir imagem usando canvas antes do upload
 */
export async function comprimirImagem(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  qualidade = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context not available'))
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Failed to compress image'))
          resolve(blob)
        },
        'image/jpeg',
        qualidade
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Gerar thumbnail local como dataURL
 */
export async function gerarThumbnail(
  file: File,
  largura = 120,
  altura = 90
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      canvas.width = largura
      canvas.height = altura

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context not available'))

      // Cover crop
      const ratio = Math.max(largura / img.width, altura / img.height)
      const sw = largura / ratio
      const sh = altura / ratio
      const sx = (img.width - sw) / 2
      const sy = (img.height - sh) / 2

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, largura, altura)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
