import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
};

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/85 focus-visible:ring-primary",
  outline:
    "border border-border bg-background/35 text-foreground hover:border-primary/60 hover:bg-secondary focus-visible:ring-primary",
  ghost:
    "text-foreground hover:bg-secondary focus-visible:ring-primary",
};

export function Button({
  asChild = false,
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}