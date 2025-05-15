import type * as React from "react";
import { useEffect } from "react";

import { cn } from "@/shared/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  useEffect(() => {
    const textArea = document.querySelectorAll(
      ".textarea",
    )[0] as HTMLTextAreaElement;
    if (!textArea) return;

    function resize() {
      if (!textArea || textArea === null) return;
      textArea.style.height = "auto";
      textArea.style.height = `${textArea.scrollHeight}px`;
    }

    resize();

    textArea.addEventListener("input", resize);
    return () => textArea.removeEventListener("input", resize);
  });

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground text-white text-lg selection:bg-input/50 selection:text-primary-foreground bg-popover border-input flex w-full min-w-0 border-2 px-3 py-2 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-lg file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-lg",
        "focus-visible:border-input focus-visible:ring-input focus-visible:ring-[3px]",
        "textarea overflow-hidden resize-none",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
