import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Layout
        "flex field-sizing-content min-h-22 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-150 resize-none",
        // Background e borda
        "bg-white border border-neutral-200",
        // Texto e placeholder
        "text-neutral-900 placeholder:text-[#9BAFC0] leading-relaxed",
        // Focus premium
        "focus-visible:border-blue-800 focus-visible:ring-[3px] focus-visible:ring-blue-800/8 focus-visible:shadow-sm",
        // Disabled
        "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-[#9BAFC0] disabled:opacity-70",
        // Erro
        "aria-invalid:border-red-400 aria-invalid:ring-[3px] aria-invalid:ring-red-500/8",
        // Dark mode
        "dark:bg-[#0A1E35] dark:border-[#1E3A5F] dark:text-[#C8DAED] dark:placeholder:text-[#4A6A8A]",
        "dark:focus-visible:border-[#4A8EC8] dark:focus-visible:ring-[#4A8EC8]/12",
        "dark:disabled:bg-[#0D1E30]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
