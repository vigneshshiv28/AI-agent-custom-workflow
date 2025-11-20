import React from "react";
import { cn } from "@/lib/utils";

const Heading = ({ children, className, as }: { children: React.ReactNode, className?: string, as: "h1" | "h2" }) => {
    const Tag = as;

    return (
        <Tag className={cn("text-2xl md:text-3xl lg:text-5xl tracking-tight font-semibold", className)}>{children}</Tag>
    )
}

export default Heading;