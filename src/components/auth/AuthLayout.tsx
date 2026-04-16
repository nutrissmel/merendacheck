import { BrandingSide } from "./BrandingSide";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[40%_1fr]">
      <BrandingSide />
      <main className="flex items-center justify-center p-6 bg-blue-50/50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
