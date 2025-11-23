import React, { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface BentoGridProps {
    children: ReactNode;
    className?: string;
}

interface BentoCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    className?: string;
    background: React.ReactNode;
    href?: string;
    cta?: string;
}

export const BentoGrid = ({ children, className = "" }: BentoGridProps) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1,
                    },
                },
            }}
            className={`grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 gap-4 mx-auto max-w-6xl w-full auto-rows-[20rem] ${className}`}
        >
            {children}
        </motion.div>
    );
};

export const BentoCard = ({
    title,
    description,
    icon,
    className = "",
    background,
    href,
    cta = "Learn more",
}: BentoCardProps) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20, scale: 0.95 },
                visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                        duration: 0.5,
                        ease: "easeOut",
                    },
                },
            }}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700/80 transition-all duration-500 ${className}`}
        >
            <div className="absolute inset-0 z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                {background}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/60 to-transparent z-10 pointer-events-none" />

            <div className="relative z-20 flex flex-col justify-end h-full p-6 md:p-8 mt-auto select-none">
                <div className="w-10 h-10 bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">
                    {title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-4 max-w-[90%]">
                    {description}
                </p>

                <div className="flex items-center text-xs font-medium text-neutral-500 group-hover:text-primary transition-colors cursor-pointer w-fit">
                    <span>{cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </motion.div>
    );
};