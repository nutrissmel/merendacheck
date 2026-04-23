import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas públicas — não exigem autenticação
const PUBLIC_ROUTES = [
  "/login",
  "/cadastro",
  "/esqueci-senha",
  "/nova-senha",
  "/primeiro-acesso",
];

// Rotas com restrição de papel
// Chave: prefixo da rota | Valor: lista de papéis permitidos
const ROTAS_POR_PAPEL: Record<string, string[]> = {
  "/configuracoes/usuarios": ["ADMIN_MUNICIPAL", "SUPER_ADMIN"],
  "/configuracoes":          ["ADMIN_MUNICIPAL", "SUPER_ADMIN"],
  "/planos":                 ["ADMIN_MUNICIPAL", "SUPER_ADMIN"],
  "/relatorios":             ["ADMIN_MUNICIPAL", "NUTRICIONISTA", "SUPER_ADMIN"],
  "/checklists":             ["ADMIN_MUNICIPAL", "NUTRICIONISTA", "DIRETOR_ESCOLA", "SUPER_ADMIN"],
  "/nao-conformidades":      ["ADMIN_MUNICIPAL", "NUTRICIONISTA", "DIRETOR_ESCOLA", "SUPER_ADMIN"],
};

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/convite/")) return true;
  if (pathname.startsWith("/api/webhooks/")) return true;
  if (pathname === "/") return true;
  return false;
}

function papelPermitido(pathname: string, papel: string | undefined): boolean {
  const rota = Object.keys(ROTAS_POR_PAPEL)
    .sort((a, b) => b.length - a.length)
    .find((prefixo) => pathname.startsWith(prefixo));

  if (!rota) return true; // Rota sem restrição de papel — qualquer usuário pode acessar
  if (!papel) return false; // Rota restrita e papel não definido
  return ROTAS_POR_PAPEL[rota].includes(papel);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = isPublicRoute(pathname);

  // ── Usuário NÃO autenticado ────────────────────────────────────
  if (!user) {
    if (!isPublic) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // ── Usuário autenticado ────────────────────────────────────────
  const papel = user.app_metadata?.papel || user.user_metadata?.papel;
  const ativo = user.app_metadata?.ativo !== false && user.user_metadata?.ativo !== false;
  const primeiroAcesso =
    user.app_metadata?.primeiro_acesso || user.user_metadata?.primeiro_acesso;

  // Conta desativada
  if (!ativo && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("erro", "conta-desativada");
    return NextResponse.redirect(loginUrl);
  }

  // Primeiro acesso → forçar troca de senha
  if (primeiroAcesso && pathname !== "/primeiro-acesso" && !isPublic) {
    return NextResponse.redirect(new URL("/primeiro-acesso", request.url));
  }

  // Autenticado tentando acessar rota pública (exceto nova-senha e primeiro-acesso)
  if (isPublic && pathname !== "/nova-senha" && pathname !== "/primeiro-acesso" && pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // "/" autenticado → dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Verificar papel para rotas restritas
  if (!isPublic && !papelPermitido(pathname, papel)) {
    const dashboardUrl = new URL("/dashboard", request.url);
    dashboardUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
