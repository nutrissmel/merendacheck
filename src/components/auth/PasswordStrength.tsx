"use client";

import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password = "" }: PasswordStrengthProps) {
  const getStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  
  const labels = ["Fraca", "Regular", "Boa", "Forte"];
  const colors = [
    "bg-red-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-green-700"
  ];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-colors",
              i <= strength ? colors[strength - 1] : "bg-neutral-200"
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", strength > 0 ? colors[strength - 1].replace("bg-", "text-") : "text-neutral-500")}>
        Senha {labels[strength - 1] || "muito curta"}
      </p>
    </div>
  );
}
