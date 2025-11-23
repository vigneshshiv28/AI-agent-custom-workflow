import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitBranch,
    CheckCircle2,
    XCircle,
    Cpu,
    Plus,
    Clock,
    WifiOff,
    Github
} from 'lucide-react';
import { FaSlack } from 'react-icons/fa';
import { SiJira, SiNotion } from 'react-icons/si';

interface StepVisualsProps {
    step: number;
}


const StepOneVisual = () => {
    return (
        <div className="relative w-full h-full max-w-[90%] max-h-[90%] mx-auto flex items-center justify-center">

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#525252" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#525252" stopOpacity="1" />
                    </linearGradient>
                </defs>


                <motion.path
                    d="M 200 80 L 200 160"
                    className="stroke-neutral-700"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                />

                <motion.path
                    d="M 180 220 L 100 300"
                    className="stroke-neutral-700"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />


                <motion.path
                    d="M 220 220 L 300 300"
                    className="stroke-neutral-700"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />

                <motion.circle
                    r="4"
                    className="fill-indigo-500"
                    animate={{
                        cy: [80, 160],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    cx="200"
                />


                <motion.circle
                    r="4"
                    className="fill-green-500"
                    initial={{ opacity: 0 }}
                    animate={{
                        cx: [180, 100],
                        cy: [220, 300],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        delay: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />


                <motion.circle
                    r="4"
                    className="fill-pink-500"
                    initial={{ opacity: 0 }}
                    animate={{
                        cx: [220, 300],
                        cy: [220, 300],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        delay: 1.8,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </svg>

            <motion.div
                initial={{ scale: 0, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="absolute top-[10%] left-1/2 -translate-x-1/2 z-10"
            >
                <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl shadow-xl flex flex-col gap-2 w-32 items-center">
                    <div className="h-1.5 w-16 bg-neutral-600 rounded-full" />
                    <div className="h-1.5 w-10 bg-neutral-700 rounded-full" />
                </div>
            </motion.div>


            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            >
                <div className="relative group">
                    <div className="w-15 h-15 bg-neutral-900 border border-indigo-500/50 rotate-45 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-transform group-hover:scale-110">
                        <GitBranch className="text-indigo-400 -rotate-45" size={20} />
                    </div>

                    <motion.div
                        className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono px-3 py-1 rounded-full"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        IF: Sentiment &gt; 0.8
                    </motion.div>
                </div>
            </motion.div>


            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-[15%] md:left-[15%] lg:bottom-[10%] xl:left-[25%] z-10 flex flex-col items-center gap-2"
            >
                <div className="w-12 h-12 bg-neutral-900 rounded-full border border-green-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 className="text-green-500" size={20} />
                </div>
                <span className="text-[10px] font-medium text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-white/5 backdrop-blur-sm">Auto-Reply</span>
            </motion.div>

            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-[15%] md:right-[15%]  lg:bottom-[10%] xl:right-[25%] z-10 flex flex-col items-center gap-2"
            >
                <div className="w-12 h-12 bg-neutral-900 rounded-full border border-pink-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.1)]">
                    <XCircle className="text-pink-500" size={20} />
                </div>
                <span className="text-[10px] font-medium text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-white/5 backdrop-blur-sm">Escalate</span>
            </motion.div>
        </div>
    );
};


const StepTwoVisual = () => {
    const tools = [
        { id: 1, icon: FaSlack, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Slack" },
        { id: 2, icon: SiNotion, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Notion" },
        { id: 3, icon: Github, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "GitHub" },
        { id: 4, icon: SiJira, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Jira" },
    ];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-8 p-4">

            <motion.div
                className="relative z-10"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-20 h-20 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl animate-pulse" />
                    <Cpu size={32} className="text-white" />
                </div>


                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] -z-10 opacity-20">
                    <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent -translate-x-1/2 -rotate-45" />
                    <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent -translate-x-1/2 rotate-45" />
                </div>

                <div className="absolute -bottom-3 -right-3 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 shadow-lg z-20">
                    HUB
                </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-sm">
                {tools.map((tool, i) => (
                    <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                        whileHover={{ scale: 1.1, y: -5 }}
                        className={`group relative flex flex-col items-center gap-2 cursor-pointer`}
                    >
                        <div className={`w-12 h-12 rounded-xl ${tool.bg} ${tool.border} border flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-${tool.color.split('-')[1]}-500/20 bg-neutral-900/50 backdrop-blur-sm`}>
                            <tool.icon size={20} className={tool.color} />
                            <motion.div
                                className="absolute -top-2 -right-2 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            >
                                <Plus size={12} strokeWidth={3} />
                            </motion.div>
                        </div>
                        <span className="text-[10px] font-medium text-neutral-500 group-hover:text-neutral-300 transition-colors">{tool.label}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};


const StepThreeVisual = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-6">
            <div className="w-full max-w-md flex flex-col gap-4">

                <div className="flex items-center justify-between bg-neutral-800/50 border border-white/5 p-3 rounded-lg backdrop-blur-sm shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </div>
                        <div className="flex flex-col leading-none gap-1">
                            <span className="text-xs font-semibold text-white">Cloud Engine</span>
                            <span className="text-[10px] text-neutral-500 font-mono">us-east-1a</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-500">
                        <Clock size={12} />
                        <span className="text-[10px] font-mono">24h Uptime</span>
                    </div>
                </div>


                <div className="h-48 bg-neutral-950 rounded-lg border border-white/10 p-4 font-mono text-[10px] leading-relaxed overflow-hidden relative shadow-inner">
                    <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-neutral-950 to-transparent z-10 pointer-events-none" />

                    <div className="flex flex-col justify-end h-full gap-2">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: i * 1.2,
                                }}
                                className="flex gap-2 items-center text-neutral-600"
                            >
                                <span className="text-neutral-700">➜</span>
                                <span>[Background] Syncing data...</span>
                            </motion.div>
                        ))}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex gap-2 items-center text-neutral-300"
                        >
                            <span className="text-indigo-500">➜</span>
                            <span>Trigger: <span className="text-yellow-500">"User Offline"</span></span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex gap-2 items-center text-neutral-300"
                        >
                            <span className="text-indigo-500">➜</span>
                            <span>Action: <span className="text-blue-400">Queue Workflow #4092</span></span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="flex gap-2 items-center text-green-400"
                        >
                            <span className="text-green-500">✓</span>
                            <span>Executed successfully</span>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="bg-neutral-800/80 border border-white/10 rounded-full py-1.5 px-4 flex items-center gap-3 mx-auto backdrop-blur-md"
                >
                    <WifiOff size={12} className="text-neutral-400" />
                    <span className="text-[10px] text-neutral-300">Disconnected • Agent Active</span>
                </motion.div>
            </div>
        </div>
    );
};

const StepVisuals = ({ step }: StepVisualsProps) => {
    return (
        <AnimatePresence mode="wait">
            {step === 0 && (
                <motion.div
                    key="step1"
                    className="w-full h-full absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)" }}
                    transition={{ duration: 0.5 }}
                >
                    <StepOneVisual />
                </motion.div>
            )}
            {step === 1 && (
                <motion.div
                    key="step2"
                    className="w-full h-full absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)" }}
                    transition={{ duration: 0.5 }}
                >
                    <StepTwoVisual />
                </motion.div>
            )}
            {step === 2 && (
                <motion.div
                    key="step3"
                    className="w-full h-full absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)" }}
                    transition={{ duration: 0.5 }}
                >
                    <StepThreeVisual />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StepVisuals;