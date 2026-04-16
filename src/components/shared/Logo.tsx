import { cn } from "@/lib/utils";
import { Utensils } from "lucide-react";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ variant = "dark", size = "md", className }: LogoProps) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 36,
  };

  return (
    <div className={cn("flex items-center gap-2 font-heading font-bold", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-lg p-1.5",
        variant === "dark" ? "bg-blue-800 text-white" : "bg-white text-blue-800"
      )}>
        <Utensils size={iconSizes[size]} />
      </div>
      <div className={sizes[size]}>
        <span className={variant === "dark" ? "text-blue-800" : "text-white"}>Merenda</span>
        <span className="text-green-600">Check</span>
      </div>
    </div>
  );
}
