"use client"
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sseManager } from "@/lib/events/sse";
import { authClient } from "@/lib/auth/auth-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => {
        return new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 5 * 60 * 1000,
                    gcTime: 10 * 60 * 1000,
                },
            },
        });
    });

    const { data: session } = authClient.useSession();

    useEffect(() => {
        const userId = session?.user?.id;
        if (!userId) return;

        sseManager.init(queryClient);
        sseManager.connect(userId);

        return () => {
            sseManager.disconnect();
        };
    }, [queryClient, session?.user?.id]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}