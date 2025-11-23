"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { GitBranch, Puzzle, Clock } from 'lucide-react';
import { Container } from '@/components/container';
import StepVisuals from "@/components/step-visuals";
import Heading from "@/components/heading";

interface Step {
    id: number;
    title: string;
    description: string;
    icon: React.FC<any>;
    duration: number;
}

const STEPS: Step[] = [
    {
        id: 0,
        title: "AI that makes decisions",
        description: "Automated workflows intelligently adapt, branching and evolving based on dynamic context and sophisticated logic.",
        icon: GitBranch,
        duration: 6000,
    },
    {
        id: 1,
        title: "Extensible agent marketplace",
        description: "Access a rich ecosystem of reusable AI agents, easily integrating specialized capabilities to enhance your workflows.",
        icon: Puzzle,
        duration: 6000,
    },
    {
        id: 2,
        title: "Automated, reliable execution",
        description: "Ensure consistent and timely completion of tasks with robust, self-managing AI operations.",
        icon: Clock,
        duration: 6000,
    },
];

const HowItWorks = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const progressInterval = useRef<number | null>(null);
    const STEP_TICK = 50;

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXFromCenter = e.clientX - rect.left - width / 2;
        const mouseYFromCenter = e.clientY - rect.top - height / 2;

        x.set(mouseXFromCenter / width);
        y.set(mouseYFromCenter / height);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };


    useEffect(() => {
        if (progressInterval.current) clearInterval(progressInterval.current);

        setProgress(0);
        let localProgress = 0;

        const currentStepData = STEPS[activeStep];
        const stepDuration = currentStepData.duration;
        const tickAmount = (STEP_TICK / stepDuration) * 100;

        progressInterval.current = window.setInterval(() => {
            localProgress += tickAmount;

            if (localProgress >= 100) {
                clearInterval(progressInterval.current!);
                setActiveStep(curr => (curr + 1) % STEPS.length);
            } else {
                setProgress(localProgress);
            }
        }, STEP_TICK);

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [activeStep]);

    const handleStepClick = (index: number) => {
        setActiveStep(index);
        setProgress(0);
    };

    return (
        <Container>
            <section className='py-8'>
                <div className="mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex text-primary text-xl items-center gap-2 px-3 py-1 font-medium uppercase tracking-wider mb-2 "
                    >
                        How it works
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-white mb-4"
                    >
                        <Heading as='h2'>
                            Intelligent automation <span className="text-transparent bg-clip-text bg-primary">that adapts.</span>
                        </Heading>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-neutral-500 max-w-2xl mx-auto text-lg"
                    >
                        Move beyond linear scripts. Build resilient, decision-making agents that work 24/7.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.2,
                                },
                            },
                        }}
                    >
                        {STEPS.map((step, index) => {
                            const isActive = activeStep === index;
                            const Icon = step.icon;

                            return (
                                <motion.div
                                    key={step.id}
                                    onClick={() => handleStepClick(index)}
                                    variants={{
                                        hidden: { opacity: 0, x: -20 },
                                        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
                                    }}
                                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative group cursor-pointer rounded-2xl border transition-all duration-300 ${isActive
                                        ? "bg-white/5 border-white/10 shadow-lg"
                                        : "bg-transparent border-transparent hover:bg-white/5"
                                        }`}
                                >

                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800 rounded-b-xl overflow-hidden z-0">
                                            <motion.div
                                                className="h-full bg-primary"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.1, ease: "linear" }}
                                            />
                                        </div>
                                    )}

                                    <div className="relative z-10 p-6 flex gap-6">
                                        <div
                                            className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-700 ${isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/25 rotate-3"
                                                : "bg-neutral-800 text-neutral-500 group-hover:bg-neutral-700 group-hover:text-neutral-300"
                                                }`}
                                        >
                                            <Icon size={24} strokeWidth={1.5} />
                                        </div>

                                        <div className="flex-grow">
                                            <h3
                                                className={`text-xl font-semibold mb-2 transition-colors duration-300 ${isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
                                                    }`}
                                            >
                                                {step.title}
                                            </h3>
                                            <p
                                                className={`leading-relaxed transition-colors duration-300 ${isActive ? "text-neutral-300" : "text-neutral-500"
                                                    }`}
                                            >
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    <motion.div
                        className="relative h-[500px] w-full perspective-1000"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        style={{
                            perspective: 1000
                        }}
                    >
                        <motion.div
                            className="w-full h-full bg-neutral-900/50 rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center p-2 group"
                            style={{
                                rotateX,
                                rotateY,
                                transformStyle: "preserve-3d"
                            }}
                        >

                            <div className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                                    backgroundSize: '24px 24px'
                                }}
                            />

                            <motion.div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"
                                animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />

                            <div className="relative w-full h-full bg-neutral-950/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden flex flex-col" style={{ transform: "translateZ(20px)" }}>

                                <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02] flex-shrink-0">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                                    </div>
                                    <div className="ml-4 h-4 w-32 rounded-full bg-white/5" />
                                    <div className="flex-grow" />
                                    <div className="h-4 w-4 rounded-full bg-white/5" />
                                </div>


                                <div className="flex-grow relative w-full flex items-center justify-center overflow-hidden">
                                    <StepVisuals step={activeStep} />
                                </div>

                                <div className="h-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between px-4 text-[10px] text-neutral-500 uppercase tracking-wider flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${activeStep === 2 ? 'bg-indigo-500 animate-pulse' : 'bg-green-500'}`} />
                                        {activeStep === 0 ? 'Waiting for decision' : activeStep === 1 ? 'Marketplace Active' : 'Scheduler Running'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
        </Container>
    );
};

export default HowItWorks;