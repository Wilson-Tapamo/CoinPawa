"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Event {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    buttonText: string | null;
    buttonLink: string | null;
}

export function EventCarousel() {
    const [events, setEvents] = useState<Event[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("/api/events/active");
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                }
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % events.length);
    }, [events.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    }, [events.length]);

    useEffect(() => {
        if (events.length <= 1) return;
        const interval = setInterval(nextSlide, 8000);
        return () => clearInterval(interval);
    }, [events.length, nextSlide]);

    if (isLoading) {
        return (
            <div className="w-full h-[220px] bg-surface/50 rounded-3xl animate-pulse border border-white/5" />
        );
    }

    if (events.length === 0) {
        // Fallback or just don't show anything (we'll handle this in the parent)
        return null;
    }

    const currentEvent = events[currentIndex];

    return (
        <section className="relative w-full h-[240px] md:h-[280px] rounded-[32px] overflow-hidden group">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentEvent.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-full h-full"
                >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0">
                        {currentEvent.imageUrl ? (
                            <Image
                                src={currentEvent.imageUrl}
                                alt={currentEvent.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-surface to-background" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-center px-8 md:px-12 max-w-2xl">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-primary font-display font-bold text-xs md:text-sm tracking-widest uppercase mb-2"
                        >
                            Événement Spécial
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl md:text-5xl font-display font-black text-white mb-4 leading-tight"
                        >
                            {currentEvent.title}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-text-secondary text-sm md:text-lg mb-6 line-clamp-2"
                        >
                            {currentEvent.description}
                        </motion.p>

                        {currentEvent.buttonLink && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Link
                                    href={currentEvent.buttonLink}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-background font-black px-6 py-3 rounded-2xl transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-0"
                                >
                                    {currentEvent.buttonText || "Rejoindre"}
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            {events.length > 1 && (
                <>
                    <div className="absolute bottom-6 right-8 flex gap-2">
                        {events.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-1.5 transition-all rounded-full ${idx === currentIndex ? "w-8 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/40"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Arrows (Hidden on mobile, visible on group hover) */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-background"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-background"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}
        </section>
    );
}
