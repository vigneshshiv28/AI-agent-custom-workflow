"use client"
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react'
import { MdOutlineEmail } from "react-icons/md";
import { FaSlack, FaWhatsapp } from "react-icons/fa";
import { LuNotebookPen } from "react-icons/lu";
import { SiNotion } from "react-icons/si";
import { Clock } from 'lucide-react';
import { motion } from "motion/react";
import { GridPattern } from "@/components/ui/grid-pattern"


type NodeIconBoxProps = {
    id: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label?: string;
    className?: string;
    active: boolean
};

const NodeIconBox = ({ icon: Icon, label, className, active }: NodeIconBoxProps) => {
    return (
        <div className={cn("relative flex flex-col items-center group", className)}>
            <div
                className={cn(
                    "w-12 h-12 bg-[#070707] border border-gray-700 rounded-md flex items-center justify-center transition-all duration-300 shadow-[-3px_3px_0px_0px_rgb(64,64,64)]  group-hover:border-white group-hover:shadow-[-3px_3px_0px_0px_white]",
                    active && "border-primary shadow-[-3px_3px_0px_0px_oklch(0.8221_0.1651_167.9443)]"
                )}
            >
                <Icon
                    className={cn(
                        "w-5 h-5 text-gray-700 transition-colors duration-300 group-hover:text-white",
                        active && "text-primary"
                    )}
                />
            </div>

            {label && (
                <div className={`group-hover:text-white absolute top-full mt-2 text-[10px] text-gray-400 uppercase tracking-wider whitespace-nowrap pointer-events-none ${active && "text-primary"} `}>
                    {label}
                </div>
            )}
        </div>
    );
};

const NodeTextBox = ({ text, icon: Icon, className, active }: { text: string, icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>, className?: string, active: boolean }) => {
    return (
        <div
            className={cn(
                "group flex justify-center items-center min-w-20 max-w-30 bg-[#070707] border border-[#202020] rounded px-3 py-1.5 text-xs text-gray-400 shadow-[-3px_3px_0px_0px_#131313] transition-all duration-300 hover:border-white hover:text-white hover:shadow-[-3px_3px_0px_0px_white]",
                className, active && "border-primary shadow-[-3px_3px_0px_0px_oklch(0.8221_0.1651_167.9443)]"
            )}
        >
            <div className={`flex items-center gap-1 ${active && "text-primary"}`}>
                {Icon && <Icon className={`w-5 h-5 text-gray-700 transition-colors duration-300 group-hover:text-white ${active && "text-primary"}`} />}
                {text}
            </div>
        </div>
    )
}

const AgentFrameworkDiagram = ({ className }: { className?: string }) => {
    const [activeNodes, setActiveNodes] = useState<Record<string, string[]>>({
        emailPath: [],
        calendarPath: [],
        slackPath: []
    });

    const [activeTextNode, setTextNode] = useState<boolean>(false);

    const activateNode = (path: string, id: string) => {
        setActiveNodes(prev => {
            const arr = prev[path];
            if (arr.includes(id)) return prev;
            return { ...prev, [path]: [...arr, id] };
        });
    };

    const resetPathNodes = (path: string) => {
        setActiveNodes(prev => ({ ...prev, [path]: [] }));
    };

    return (
        <div className={cn(" w-full h-screen min-w-3xl bg-black p-8  relative", className)}>
            <GridPattern className=' md:opacity-50 lg:opacity-100'
            />
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ zIndex: 0 }}
            >
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <line x1="20" y1="50" x2="40" y2="50" stroke="#666" strokeWidth="0.2" />
                <line x1="40" y1="50" x2="50" y2="50" stroke="#666" strokeWidth="0.2" />
                <line x1="50" y1="50" x2="60" y2="50" stroke="#666" strokeWidth="0.2" />
                <line x1="50" y1="21" x2="50" y2="50" stroke="#666" strokeWidth="0.2" />
                <line x1="50" y1="21" x2="60" y2="21" stroke="#666" strokeWidth="0.2" />
                <line x1="50" y1="50" x2="60" y2="50" stroke="#666" strokeWidth="0.2" />
                <line x1="50" y1="50" x2="85" y2="50" stroke="#666" strokeWidth="0.2" />

                {/* Calendar */}
                <line x1="20" y1="51" x2="32" y2="51" stroke="#666" strokeWidth="0.2" />
                <line x1="32" y1="51" x2="32" y2="80" stroke="#666" strokeWidth="0.2" />
                <line x1="32" y1="80" x2="40" y2="80" stroke="#666" strokeWidth="0.2" />
                <line x1="40" y1="80" x2="50" y2="80" stroke="#666" strokeWidth="0.2" />
                <line x1="50" y1="51" x2="50" y2="80" stroke="#666" strokeWidth="0.2" />
                <line x1="50" y1="51" x2="60" y2="51" stroke="#666" strokeWidth="0.2" />
                <line x1="60" y1="51" x2="85" y2="51" stroke="#666" strokeWidth="0.2" />

                {/* Mails */}
                <line x1="20" y1="49" x2="32" y2="49" stroke="#666" strokeWidth="0.2" />
                <line x1="32" y1="49" x2="32" y2="20" stroke="#666" strokeWidth="0.2" />
                <line x1="32" y1="20" x2="40" y2="20" stroke="#666" strokeWidth="0.2" />
                <line x1="40" y1="20" x2="60" y2="20" stroke="#666" strokeWidth="0.2" />
                <line x1="60" y1="20" x2="85" y2="20" stroke="#666" strokeWidth="0.2" />
                <line x1="75" y1="20" x2="75" y2="21" stroke="#666" strokeWidth="0.2" />
                <line x1="60" y1="21" x2="75" y2="21" stroke="#666" strokeWidth="0.2" />
                <line x1="75" y1="21" x2="75" y2="49" stroke="#666" strokeWidth="0.2" />
                <line x1="75" y1="49" x2="85" y2="49" stroke="#666" strokeWidth="0.2" />

                {/* Animated path 1 - to Email */}
                {/* Segment 1 */}
                <motion.path
                    d="M 20 49 L 32 49 L 32 20 L 40 20"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{
                        pathLength: [0, 1, 1, 1],
                        opacity: [1, 1, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.28, 0.95, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    onUpdate={(latest) => {
                        const value = latest.pathLength as number;
                        if (value >= 0.95) {
                            activateNode("emailPath", "read-email");
                        }
                        if (value <= 0.05) {
                            setTextNode(true)
                            resetPathNodes("emailPath")
                        }
                    }}
                />

                {/* Segment 2 */}
                <motion.path
                    d="M 40 20 L 60 20"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.28, 0.56, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    onUpdate={(latest) => {
                        const value = latest.pathLength as number;
                        if (value >= 0.95) {
                            activateNode("emailPath", "schedule-events");
                        }
                    }}
                />

                {/* Segment 3 */}
                <motion.path
                    d="M 60 20 L 75 20"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.56, 0.78, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />

                {/* Segment 4 */}
                <motion.path
                    d="M 75 20 L 85 20"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.78, 0.83, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    onUpdate={(latest) => {
                        const value = latest.pathLength as number;
                        if (value >= 0.95) {
                            activateNode("emailPath", "whatsapp");
                        }
                    }}
                />

                {/* Segment 4b (Vertical) */}
                <motion.path
                    d="M 75 20 L 75 49 L 85 49"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    filter="url(#glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.78, 0.83, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />

                {/* Slack Path (Middle) */}
                {/* Segment 1 */}
                <motion.path
                    d="M 20 50 L 40 50"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{
                        pathLength: [0, 1, 1, 1],
                        opacity: [1, 1, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.28, 0.95, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    onUpdate={(latest) => {
                        const value = latest.pathLength as number;
                        if (value >= 0.95) {
                            activateNode("slackPath", "read-slack");
                        }
                        if (value <= 0.05) {
                            resetPathNodes("slackPath")
                        }
                    }}
                />
                {/* Segment 2 */}
                <motion.path
                    d="M 40 50 L 60 50"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.28, 0.56, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    onUpdate={(latest) => {
                        const value = latest.pathLength as number;
                        if (value >= 0.95) {
                            activateNode("slackPath", "summarize");
                        }
                    }}
                />

                <motion.path
                    d="M 50 50 L 50 21 L 60 21"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.28, 0.56, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    onUpdate={(latest) => {
                        const value = latest.pathLength as number;
                        if (value >= 0.95) {
                            activateNode("slackPath", "summarize");
                        }
                    }}
                />
                {/* Segment 3 */}
                <motion.path
                    d="M 60 50 L 75 50"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.56, 0.78, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />
                <motion.path
                    d="M 60 21 L 75 21"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.56, 0.78, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />
                {/* Segment 4 */}
                <motion.path
                    d="M 75 50 L 85 50"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.78, 0.83, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    onUpdate={(latest) => {
                        const value = latest.pathLength as number;
                        if (value >= 0.95) {
                            activateNode("slackPath", "list-notion");
                        }
                    }}
                />

                {/* Calendar Path (Bottom) */}
                {/* Segment 1 */}
                <motion.path
                    d="M 20 51 L 32 51 L 32 80 L 40 80"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{
                        pathLength: [0, 1, 1, 1],
                        opacity: [1, 1, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.28, 0.95, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    onUpdate={(latest) => {
                        const value = latest.pathLength as number;
                        if (value >= 0.95) {
                            activateNode("calendarPath", "read-calendar");
                        }
                        if (value <= 0.05) {
                            resetPathNodes("calendarPath")
                        }
                    }}
                />
                {/* Segment 2 */}
                <motion.path
                    d="M 40 80 L 50 80 L 50 51 L 60 51"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.28, 0.56, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />
                {/* Segment 3 */}
                <motion.path
                    d="M 60 51 L 75 51"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.56, 0.78, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />
                {/* Segment 4 */}
                <motion.path
                    d="M 75 51 L 85 51"
                    stroke="oklch(0.8221 0.1651 167.9443)"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 0, 1, 1],
                        opacity: [0, 0, 1, 0]
                    }}
                    transition={{
                        duration: 9,
                        times: [0, 0.78, 0.83, 1],
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />

            </svg>

            <div className="grid grid-cols-4 grid-rows-3 h-full items-center relative">
                <NodeTextBox className=' col-start-1 row-start-2 justify-self-end mr-4' text='9:00 AM' icon={Clock} active={activeTextNode} />
                <NodeIconBox className=' col-start-2 row-start-1' id="read-email" icon={MdOutlineEmail} label="Unread Mails" active={activeNodes.emailPath.includes("read-email")} />
                <NodeIconBox className=' col-start-2 row-start-2' id="read-slack" icon={FaSlack} label="Unread DMs" active={activeNodes.slackPath.includes("read-slack")} />
                <NodeIconBox className=' col-start-2 row-start-3' id="read-calendar" icon={CalendarDays} label="Today's Event" active={activeNodes.calendarPath.includes("read-calendar")} />
                <NodeIconBox className=' col-start-3 row-start-2' id="summarize" icon={LuNotebookPen} label="Summarize" active={activeNodes.slackPath.includes("summarize")} />
                <NodeIconBox className=' col-start-3 row-start-1' id="schedule-events" icon={CalendarDays} label="Schedule Meets" active={activeNodes.emailPath.includes("schedule-events")} />
                <NodeIconBox className=' col-start-4 row-start-1' id="whatsapp" icon={FaWhatsapp} label="Recieved Message" active={activeNodes.emailPath.includes("whatsapp")} />
                <NodeIconBox className=' col-start-4 row-start-2' id="list-notion" icon={SiNotion} label="List Task" active={activeNodes.slackPath.includes("list-notion")} />
            </div>
        </div>
    )
}

export default AgentFrameworkDiagram
