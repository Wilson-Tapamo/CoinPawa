"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-95";

        // Variants
        const variants = {
            primary: "bg-primary text-background hover:bg-primary-hover shadow-glow-gold hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-transparent",
            secondary: "bg-white/5 text-white hover:bg-white/10 backdrop-blur-md border border-white/10",
            danger: "bg-accent-rose text-white hover:bg-red-600 shadow-glow-rose",
            ghost: "bg-transparent text-text-secondary hover:text-white hover:bg-white/5",
            outline: "bg-transparent border border-white/20 text-white hover:border-primary hover:text-primary",
        };

        // Sizes
        const sizes = {
            sm: "h-8 px-3 text-xs rounded-lg",
            md: "h-10 px-5 py-2 text-sm rounded-xl",
            lg: "h-12 px-8 text-base rounded-full",
            icon: "h-10 w-10 p-2 rounded-xl",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
