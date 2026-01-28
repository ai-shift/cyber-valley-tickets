import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

interface CardCutProps {
  children: React.ReactNode;
  className?: string;
  svgClassName?: string;
  pathClassName?: string;
  asChild?: boolean;
}

export function CardCut({
  children,
  className,
  svgClassName,
  pathClassName,
  asChild = false,
}: CardCutProps) {
  const Comp = asChild ? Slot : "div";

  return (
    <div className={cn("relative", className)}>
      <svg
        className={cn(
          "absolute inset-0 w-full h-full pointer-events-none",
          svgClassName,
        )}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          className={pathClassName}
          d="M 0 0
					   L 80 0
					   L 100 20
					   L 100 100
					   L 20 100
					   L 0 80
					   Z"
          fill="currentColor"
        />
      </svg>
      <Comp className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </Comp>
    </div>
  );
}
