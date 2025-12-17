import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { gradient?: boolean; hoverEffect?: boolean }
>(({ className, gradient, hoverEffect, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-2xl border border-white/5 bg-surface text-text-primary shadow-lg backdrop-blur-sm relative overflow-hidden",
            gradient && "bg-gradient-to-br from-surface to-background-secondary",
            hoverEffect && "transition-all duration-300 hover:border-primary/30 hover:shadow-glow-purple/20 group",
            className
        )}
        {...props}
    />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("font-display text-xl font-bold leading-none tracking-tight text-white", className)}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0 text-text-secondary", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
