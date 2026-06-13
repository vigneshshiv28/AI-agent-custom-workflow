import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html>
            <body>
                <QueryProvider>
                    {children}
                </QueryProvider>
                <Toaster />
            </body>
        </html>
    );
}