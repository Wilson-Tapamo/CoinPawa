"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameCardProps {
    title: string;
    provider: string;
    image: string; // Can be gradient class OR image path
    imageSrc?: string; // Actual image path
    isHot?: boolean;
    isNew?: boolean;
    RTP?: string;
    highlight?: boolean;
}

export function GameCard({ title, provider, image, imageSrc, isHot, isNew, RTP, highlight }: GameCardProps) {
    const hasImage = imageSrc && imageSrc.startsWith("/");

    return (
        <div className={cn(
            "group relative rounded-xl overflow-hidden cursor-pointer transition-all",
            highlight && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-glow-gold scale-[1.02]"
        )}>
            {/* Background Image or Gradient */}
            <div className="aspect-[3/4] w-full bg-surface relative overflow-hidden">
                {hasImage ? (
                    <Image
                        src={imageSrc}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${image} opacity-80 group-hover:scale-110 transition-transform duration-700 ease-out`} />
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {highlight && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-primary text-background rounded-sm shadow-glow-gold animate-pulse">EN VEDETTE</span>
                    )}
                    {isHot && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-accent-rose text-white rounded-sm shadow-glow-purple">Hot</span>
                    )}
                    {isNew && !highlight && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-accent-cyan text-background rounded-sm shadow-glow-cyan">Nouveau</span>
                    )}
                </div>

                {/* RTP Badge */}
                {RTP && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[10px] font-mono text-primary border border-primary/20">
                        {RTP}% RTP
                    </div>
                )}

                {/* Play Overlay (Hidden by default, shown on hover) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/40 backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-glow-gold transform scale-50 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-5 h-5 text-background ml-1 fill-current" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-text-tertiary text-xs truncate">{provider}</p>
            </div>

            {/* Hover Border Glow */}
            <div className={cn(
                "absolute inset-0 border rounded-xl transition-colors pointer-events-none",
                highlight ? "border-primary/50" : "border-white/5 group-hover:border-primary/50"
            )} />
        </div>
    );
}
