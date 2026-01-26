"use client";

import { cn } from "@/lib/utils";

interface RouletteTableProps {
    bets: { [key: string]: number };
    onPlaceBet: (type: string) => void;
    onClearBets: () => void;
}

export function RouletteTable({ bets, onPlaceBet, onClearBets }: RouletteTableProps) {
    const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    const getNumberColor = (num: number) => {
        if (num === 0) return "bg-green-600";
        return RED_NUMBERS.includes(num) ? "bg-red-600" : "bg-zinc-800";
    };

    // Columns are typically arranged as:
    // Row 1: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
    // Row 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
    // Row 3: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34

    const rows = [
        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
        [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
        [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
    ];

    const renderBetSpot = (id: string, label: string, className: string) => (
        <button
            onClick={() => onPlaceBet(id)}
            className={cn(
                "relative flex items-center justify-center font-bold text-white transition-all transform active:scale-95 border border-white/10 hover:brightness-110",
                className
            )}
        >
            {label}
            {bets[id] > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-primary text-background text-[10px] font-black border-2 border-white shadow-lg flex items-center justify-center animate-in zoom-in duration-200">
                        {bets[id] >= 1000 ? (bets[id] / 1000).toFixed(1) + 'k' : bets[id]}
                    </div>
                </div>
            )}
        </button>
    );

    return (
        <div className="w-full overflow-x-auto no-scrollbar py-4">
            <div className="min-w-[800px] flex flex-col space-y-1 select-none">

                <div className="flex space-x-1">
                    {/* Zero */}
                    <div className="w-16 flex">
                        {renderBetSpot("0", "0", "w-full h-[150px] bg-green-600 rounded-l-xl")}
                    </div>

                    {/* Main Grid */}
                    <div className="flex-1 flex flex-col space-y-1">
                        {rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex space-x-1">
                                {row.map((num) => (
                                    <div key={num} className="flex-1">
                                        {renderBetSpot(num.toString(), num.toString(), cn("w-full h-[50px]", getNumberColor(num)))}
                                    </div>
                                ))}
                                {/* Column Bets */}
                                <div className="w-16">
                                    {renderBetSpot(`col${3 - rowIndex}`, "2:1", "w-full h-[50px] bg-white/5 text-[10px]")}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Specials */}
                <div className="flex space-x-1 ml-16">
                    <div className="flex-1 space-y-1">
                        <div className="flex space-x-1">
                            {renderBetSpot("1st12", "1ère 12", "flex-1 h-12 bg-white/5 text-xs")}
                            {renderBetSpot("2nd12", "2ème 12", "flex-1 h-12 bg-white/5 text-xs")}
                            {renderBetSpot("3rd12", "3ème 12", "flex-1 h-12 bg-white/5 text-xs")}
                        </div>
                        <div className="flex space-x-1">
                            {renderBetSpot("1-18", "1-18", "flex-1 h-12 bg-white/5 text-xs")}
                            {renderBetSpot("even", "Pair", "flex-1 h-12 bg-white/5 text-xs")}
                            {renderBetSpot("red", "Rouge", "flex-1 h-12 bg-red-600/40 border-red-500/50 text-xs")}
                            {renderBetSpot("black", "Noir", "flex-1 h-12 bg-zinc-800 border-white/5 text-xs")}
                            {renderBetSpot("odd", "Impair", "flex-1 h-12 bg-white/5 text-xs")}
                            {renderBetSpot("19-36", "19-36", "flex-1 h-12 bg-white/5 text-xs")}
                        </div>
                    </div>
                    <div className="w-16" /> {/* Placeholder for alignment with columns */}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={onClearBets}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-lg text-xs font-bold transition-colors"
                    >
                        Effacer Tout
                    </button>
                </div>
            </div>
        </div>
    );
}
