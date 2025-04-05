import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <img src="/images/orangelogo.svg" alt="Orange Logo" className="h-8" />
      <span className="text-xl font-bold text-[#F37920]">Auth Template</span>
    </div>
  );
}
