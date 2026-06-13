import React from 'react';
import { Metric } from '@/types/components';

interface MetricsStripProps {
    metrics: Metric[];
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({ metrics }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {metrics.map((metric, index) => (
                <div
                    key={index}
                    className="relative group bg-card rounded-lg shadow-premium hover:shadow-premium-hover transition-all duration-300 p-8 flex items-start justify-between overflow-hidden hover:scale-[1.01]"
                >
                    {/* Surface Effects */}
                    <div className="absolute inset-0 bg-matte-gradient opacity-100 pointer-events-none" />
                    <div className="absolute inset-0 shadow-inner-glow rounded-lg pointer-events-none" />
                    <div className="absolute inset-0 rounded-lg border border-white/10 pointer-events-none group-hover:border-white/20 transition-colors" />

                    <div className="relative z-10 flex flex-col gap-4">
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{metric.label}</span>
                        <span className="text-4xl font-bold tracking-tight text-foreground">{metric.value}</span>
                    </div>
                    <div className={`relative z-10 p-3 rounded-xl border backdrop-blur-md ${metric.status === 'negative' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        metric.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            metric.status === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                'bg-white/5 text-muted-foreground border-white/10'
                        }`}>
                        {React.cloneElement(metric.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
                    </div>
                </div>
            ))}
        </div>
    );
};