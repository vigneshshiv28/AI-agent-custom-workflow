import React from 'react';
import { motion } from 'motion/react';
import {
    GitCommit,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    GitBranch,
    Clock
} from 'lucide-react';


type Status = 'success' | 'error' | 'warning' | 'pending';

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    status: Status;
}


const DATA: NotificationItem[] = [
    { id: '1', title: "Workflow 'Daily Report' executed successfully", description: "Processed 150 items in 2s.", time: "2m ago", status: 'success' },
    { id: '2', title: "Workflow 'Data Sync' failed", description: "Node 'HTTP Request' returned 500 error.", time: "5m ago", status: 'error' },
    { id: '3', title: "Workflow 'Email Campaign' is running", description: "Processing 250 emails.", time: "12m ago", status: 'pending' },
    { id: '4', title: "Workflow 'User Onboarding' activated", description: "Ready to process new users.", time: "15m ago", status: 'success' },
    { id: '5', title: "Credential 'Stripe API' expiring soon", description: "Expires in 7 days. Please update.", time: "22m ago", status: 'warning' },
    { id: '6', title: "Workflow 'Image Resizer' deploying", description: "New version being pushed to production.", time: "30m ago", status: 'pending' },
    { id: '7', title: "Workflow 'Slack Notifications' updated", description: "New logic for channel selection applied.", time: "45m ago", status: 'success' },
    { id: '8', title: "Workflow 'Database Cleanup' failed", description: "Node 'Execute SQL' timed out.", time: "1h ago", status: 'error' },
];



const StatusIcon = ({ status }: { status: Status }) => {
    switch (status) {
        case 'success':
            return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        case 'error':
            return <XCircle className="w-4 h-4 text-rose-500" />;
        case 'warning':
            return <AlertCircle className="w-4 h-4 text-amber-500" />;
        case 'pending':
            return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
        default:
            return <GitCommit className="w-4 h-4 text-slate-400" />;
    }
};

const NotificationCard: React.FC<{ item: NotificationItem }> = ({ item }) => {
    return (
        <motion.div
            // Micro-interaction: Card lifts and highlights on hover
            whileHover={{ scale: 1.02, x: 2, backgroundColor: "#F8FAFC" }}
            className={`
        relative
        flex items-center justify-between
        w-full p-3 mb-3
        rounded-xl
        border border-slate-100
        bg-white
        shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]
        cursor-pointer
        group
        transition-colors duration-200
        hover:border-slate-200 hover:shadow-md
      `}
        >
            {/* Left Side: Icon & Text */}
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`
                flex-shrink-0
                w-8 h-8 rounded-full flex items-center justify-center
                bg-slate-50 border border-slate-100
                group-hover:bg-white group-hover:scale-110 transition-all duration-300
            `}>
                    <StatusIcon status={item.status} />
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs text-slate-800 truncate pr-2 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                        {item.title}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <GitBranch className="w-3 h-3 opacity-50" />
                        <span className="truncate max-w-[120px]">{item.description}</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Time & Indicator */}
            <div className="flex flex-col items-end gap-1.5 pl-2 shrink-0">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                    <Clock className="w-2.5 h-2.5" />
                    {item.time}
                </div>
                <div className={`
              h-1 w-6 rounded-full 
              ${item.status === 'success' ? 'bg-emerald-400' :
                        item.status === 'error' ? 'bg-rose-400' :
                            item.status === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}
              opacity-60 group-hover:opacity-100 group-hover:w-full transition-all duration-300
            `} />
            </div>
        </motion.div>
    );
};



interface NotificationFeedProps {
    className?: string;
}

export const NotificationFeed: React.FC<NotificationFeedProps> = ({ className = "" }) => {

    const marqueeData = [...DATA, ...DATA, ...DATA];

    return (
        <div className={`relative h-full w-full overflow-hidden bg-neutral-900 ${className}`}>


            <div className="absolute top-0 left-0 right-0 h-12  z-10 pointer-events-none" />


            <motion.div
                className="flex flex-col px-4 py-2"
                animate={{ y: ["0%", "-33.33%"] }}
                transition={{
                    duration: 40,
                    ease: "linear",
                    repeat: Infinity
                }}
            >
                {marqueeData.map((item, index) => (
                    <NotificationCard key={`${item.id}-${index}`} item={item} />
                ))}
            </motion.div>

            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none" />
        </div >
    );
};