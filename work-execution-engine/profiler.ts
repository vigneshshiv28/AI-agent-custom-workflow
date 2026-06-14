export async function measureExecutionTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const label = `Execution: ${name}`;
    console.time(label);
    const response = await fn();
    console.timeEnd(label);
    return response;
}

export function measureExecutionTimeSync<T>(name: string, fn: () => T): T {
    const label = `Execution: ${name}`;
    console.time(label);
    const response = fn();
    console.timeEnd(label);
    return response;
}