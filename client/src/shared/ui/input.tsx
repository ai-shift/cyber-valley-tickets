import type * as React from "react";

import { cn } from "@/shared/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground text-white text-lg selection:bg-input/50 selection:text-primary-foreground bg-popover border-input flex w-full min-w-0 border-2 px-3 py-2 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-lg",
        "focus-visible:border-input focus-visible:ring-input focus-visible:ring-[3px]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
