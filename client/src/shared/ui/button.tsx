import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center text-white font-medium uppercase tracking-wider cursor-pointer border-[1px] disabled:opacity-75 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-secondary text-secondary-foreground shadow-xs outline-secondary border-secondary",
        destructive: "bg-destructive text-white shadow-xs border-destructive",
        secondary:
          "bg-primary text-secondary-foreground shadow-xs  border-primary",
        ghost: "hover:bg-primary-foreground hover:text-black",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 text-lg px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-14 text-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
      filling: {
        default: "",
        outline: "bg-background text-primary-foreground",
      },
      clipping: {
        default: "clip-corners",
        noclip: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      filling: "default",
      clipping: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  filling,
  clipping,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, filling, clipping, className }),
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
