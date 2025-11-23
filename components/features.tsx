"use client";

import { BentoGrid, BentoCard } from "@/components/ui/bento-grid-card";
import { Container } from "@/components/container";
import {
    Bell,
    Calendar,
    Share2,
    Workflow,
    GitGraph,
    Zap,
    Clock,
    Command,
    LinkIcon,
} from 'lucide-react';
import { motion } from "motion/react";
import SlackIcon from "@/components/icons/slack"
import CalendarIcon from "@/components/icons/calendar"
import GmailIcon from "@/components/icons/gmail"
import NotionIcon from "@/components/icons/notion"
import { NotificationFeed } from "@/components/notification-card";
import { LogoIcon } from "@/components/logo";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import Heading from "@/components/heading";
import { cn } from "@/lib/utils";

const WorkflowBackground = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center opacity-100 bg-neutral-950">

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            <div className="relative w-full h-full overflow-hidden">

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full max-w-lg aspect-video p-8 flex items-center justify-center">


                        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-neutral-700" style={{ strokeWidth: 2 }}>
                            <path d="M120 100 C 180 100, 180 150, 240 150" fill="none" />
                            <path d="M240 150 C 300 150, 300 100, 360 100" fill="none" />
                            <path d="M240 150 C 300 150, 300 200, 360 200" fill="none" />


                            <motion.circle r="3" fill="#8b5cf6">
                                <animateMotion dur="2s" repeatCount="indefinite" path="M120 100 C 180 100, 180 150, 240 150" />
                            </motion.circle>
                            <motion.circle r="3" fill="#8b5cf6">
                                <animateMotion dur="2s" begin="1s" repeatCount="indefinite" path="M240 150 C 300 150, 300 100, 360 100" />
                            </motion.circle>
                        </svg>

                        <div className="absolute left-[80px] top-[80px] w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-lg shadow-purple-900/20">
                            <Zap className="w-5 h-5 text-white" />
                        </div>

                        <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-600 flex items-center justify-center shadow-xl z-10">
                            <GitGraph className="w-8 h-8 text-purple-400" />
                        </div>

                        <div className="absolute right-[80px] top-[80px] w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-lg">
                            <Command className="w-5 h-5 text-neutral-400" />
                        </div>

                        <div className="absolute right-[80px] bottom-[80px] w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-lg">
                            <Share2 className="w-5 h-5 text-neutral-400" />
                        </div>

                        <div className="absolute top-[40px] left-[50%] -translate-x-1/2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <span className="text-xs text-green-400 font-medium">Pipeline Active</span>
                        </div>

                    </div>
                </div>

                <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] pointer-events-none" />
            </div>
        </div>
    );
};


const SchedulingBackground = () => {
    return (
        <div className="absolute inset-0  flex items-start justify-center opacity-100">
            <div className="relative w-32 h-32 border-4 border-neutral-800 rounded-full flex items-center justify-center">
                <motion.div
                    className="absolute w-1 h-12 bg-amber-500 origin-bottom bottom-1/2 left-1/2 -translate-x-1/2 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute w-1 h-8 bg-neutral-500 origin-bottom bottom-1/2 left-1/2 -translate-x-1/2 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                />
                <div className="w-2 h-2 bg-white rounded-full z-10" />
            </div>
        </div>
    );
};

const NotificationBackground = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <NotificationFeed />
        </div>
    );
};

const IntegrationsBackground = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">

            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 25%, rgba(139, 92, 246, 0.05) 50%, transparent 75%)'
                }}
            />
            <div
                className="absolute w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none
                bg-[radial-gradient(circle,_var(--tw-gradient-stops))]
                from-primary/40 via-primary/10 to-transparent"
            />

            <LogoIcon className="fill-primary" />

            <OrbitingCircles iconSize={30} radius={50} speed={2}>
                <SlackIcon />
            </OrbitingCircles>

            <OrbitingCircles iconSize={30} radius={80} speed={2}>
                <CalendarIcon />
            </OrbitingCircles>

            <OrbitingCircles iconSize={30} radius={110} reverse speed={2}>
                <GmailIcon />
            </OrbitingCircles>

            <OrbitingCircles iconSize={30} radius={140} speed={2}>
                <NotionIcon />
            </OrbitingCircles>
        </div>
    );
};


export default function Features() {
    return (
        <Container>
            <div className="py-10">
                <div className="mb-12 text-center">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Heading as="h2" className=" text-primary">
                            Everything you need to automate
                        </Heading>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-4 text-lg text-neutral-500 "
                    >
                        Powerful features to build, manage, and scale your agentic workflows.
                    </motion.p>
                </div>
                <BentoGrid>

                    <BentoCard
                        className="col-span-1 md:col-span-4"
                        title="Visual Workflow Builder"
                        description="Design, test, and deploy automation workflows with our intuitive drag-and-drop interface. No coding required."
                        icon={<Workflow className="w-5 h-5 text-purple-400" />}
                        background={<WorkflowBackground />}
                    />


                    <BentoCard
                        className="col-span-1 md:col-span-2 row-span-2"
                        title="Live Activity Feed"
                        description="Monitor deployment status, system health, and team activity in real-time."
                        icon={<Bell className="w-5 h-5 text-red-400" />}
                        background={<NotificationBackground />}
                    />


                    <BentoCard
                        className="col-span-1 md:col-span-2"
                        title="Seamless Integrations"
                        description="Connect your existing stack with over 100+ one-click integrations."
                        icon={<Share2 className="w-5 h-5 text-blue-400" />}
                        background={<IntegrationsBackground />}
                    />


                    <BentoCard
                        className="col-span-1 md:col-span-2"
                        title="Smart Scheduling"
                        description="AI-powered task scheduling that optimizes team velocity and resource allocation."
                        icon={<Clock className="w-5 h-5 text-amber-400" />}
                        background={<SchedulingBackground />}
                    />
                </BentoGrid>
            </div>
        </Container>
    );
}