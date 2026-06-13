import ApiError from "@/lib/errors/api-errors"

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers
        },
    })

    if (!response.ok) {
        const body = await response.json().catch(() => ({}))

        // Support both { error: "string" } and { error: { message, code, details } }
        const errPayload = body?.error;
        const message = typeof errPayload === 'string'
            ? errPayload
            : errPayload?.message ?? 'Unknown error';
        const code = typeof errPayload === 'object' ? errPayload?.code ?? '' : '';
        const details = typeof errPayload === 'object' ? errPayload?.details ?? '' : '';

        throw new ApiError(message, response.status, code, details)
    }

    return response.json()
}