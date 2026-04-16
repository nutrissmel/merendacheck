import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params;

  if (!/^\d{7}$/.test(codigo)) {
    return NextResponse.json({ erro: "Código IBGE inválido" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigo}`,
      {
        next: { revalidate: 86400 }, // Cache de 24h
      }
    );

    if (!response.ok) {
      return NextResponse.json({ erro: "Município não encontrado" }, { status: 404 });
    }

    const data = await response.json();

    return NextResponse.json({
      nome: data.nome,
      estado: data.microrregiao.mesorregiao.UF.nome,
      uf: data.microrregiao.mesorregiao.UF.sigla,
    });
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao buscar dados do IBGE" }, { status: 500 });
  }
}
