export async function retry<T>(
    fn: () => Promise<T>,
    attempts: number,
    delayMs: number,
): Promise<T> {

    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {

        try {
            return await fn();
        } catch (error) {

            lastError = error;

            if (attempt === attempts) {
                throw error;
            }

            await new Promise(resolve =>
                setTimeout(resolve, delayMs)
            );
        }
    }

    throw lastError;
}