import { GoogleProvider } from "@/lib/integrations/providers/google-provider";
import { NextResponse } from "next/server";

export async function GET() {
    const provider = new GoogleProvider();

    const url =
        await provider.getAuthUrl(
            "test-user"
        );

    return NextResponse.json({
        url
    });
}