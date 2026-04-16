import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Layout
        "h-10 w-full min-w-0 rounded-xl px-3.5 py-2 text-sm outline-none transition-all duration-150",
        // Background e borda — explicitamente branco para sobrescrever base-ui
        "bg-white border border-neutral-200",
        // Texto e placeholder
        "text-neutral-900 placeholder:text-[#9BAFC0]",
        // Focus premium — borda azul + halo suave
        "focus-visible:border-blue-800 focus-visible:ring-[3px] focus-visible:ring-blue-800/8 focus-visible:shadow-sm",
        // File input
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-900",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-[#9BAFC0] disabled:opacity-70",
        // Erro
        "aria-invalid:border-red-400 aria-invalid:ring-[3px] aria-invalid:ring-red-500/8",
        // Dark mode
        "dark:bg-[#0A1E35] dark:border-[#1E3A5F] dark:text-[#C8DAED] dark:placeholder:text-[#4A6A8A]",
        "dark:focus-visible:border-[#4A8EC8] dark:focus-visible:ring-[#4A8EC8]/12",
        "dark:disabled:bg-[#0D1E30] dark:aria-invalid:border-red-500/60 dark:aria-invalid:ring-red-500/12",
        className
      )}
      {...props}
    />
  )
}

export { Input }
