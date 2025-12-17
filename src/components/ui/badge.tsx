import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "success" | "warning" | "danger" | "outline" | "hot" | "new";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "bg-surface hover:bg-surface-hover text-white border-transparent",
        success: "bg-success/10 text-success border-success/20",
        warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        danger: "bg-red-500/10 text-red-500 border-red-500/20",
        outline: "text-text-secondary border-white/10",
        hot: "bg-accent-rose text-white border-transparent shadow-glow-rose",
        new: "bg-accent-cyan text-black border-transparent shadow-glow-cyan",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 uppercase tracking-wide",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}

export { Badge };
