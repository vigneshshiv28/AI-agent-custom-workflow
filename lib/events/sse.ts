import type { QueryClient } from '@tanstack/react-query';
import type { SSEEvent } from './sse-events';
import { toast } from 'sonner';

type Listener<T = SSEEvent> = (event: T) => void;


class SSEManager {
    private eventSource: EventSource | null = null;
    private queryClient: QueryClient | null = null;
    private userId: string | null = null;

    private listeners = new Map<string, Set<Listener>>();

    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private reconnectDelay = 1_000;
    private readonly maxDelay = 30_000;
    private shouldReconnect = false;




    init(queryClient: QueryClient): void {
        this.queryClient = queryClient;
    }


    connect(userId: string): void {
        if (typeof window === 'undefined') return;
        if (this.eventSource?.readyState === EventSource.OPEN) return;

        this.userId = userId;
        this.shouldReconnect = true;
        this.openConnection();
    }


    disconnect(): void {
        this.shouldReconnect = false;
        this.clearReconnectTimer();
        this.eventSource?.close();
        this.eventSource = null;
    }


    addListener<T extends SSEEvent>(eventType: T['type'], cb: Listener<T>): () => void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(cb as Listener);

        return () => this.removeListener(eventType, cb as Listener);
    }

    removeListener(eventType: string, cb: Listener): void {
        this.listeners.get(eventType)?.delete(cb);
    }


    private openConnection(): void {
        this.eventSource?.close();

        const es = new EventSource(`/api/stream/${this.userId}`);
        this.eventSource = es;


        es.addEventListener('connected', (e: MessageEvent) => {
            this.reconnectDelay = 1_000;
            toast.success('Connected to SSE endpoint!');
            try {
                const data = JSON.parse(e.data) as SSEEvent;
                this.notifyListeners(data);
            } catch { }
        });

        for (const eventType of ['node:start', 'node:success', 'node:error', 'agent:tool:start', 'agent:tool:result'] as const) {
            es.addEventListener(eventType, (e: MessageEvent) => {
                this.handleRawEvent(eventType, e.data);
            });
        }

        for (const eventType of ['workflow:start', 'workflow:complete', 'workflow:failed'] as const) {
            es.addEventListener(eventType, (e: MessageEvent) => {
                this.handleRawEvent(eventType, e.data);
            });
        }

        for (const eventType of ['agent:tool:start', 'agent:tool:result'] as const) {
            es.addEventListener(eventType, (e: MessageEvent) => {
                this.handleRawEvent(eventType, e.data);
            });
        }

        es.onerror = () => {
            es.close();
            this.eventSource = null;
            if (this.shouldReconnect) {
                this.scheduleReconnect();
            }
        };
    }

    private handleRawEvent(eventType: string, raw: string): void {
        try {
            const data = JSON.parse(raw) as SSEEvent;
            this.patchQueryCache(data);
            this.notifyListeners(data);
        } catch {
            console.warn('[SSEManager] Failed to parse SSE event:', eventType, raw);
        }
    }


    private patchQueryCache(event: SSEEvent): void {
        if (!this.queryClient) return;

        switch (event.type) {
            case 'workflow:complete':
            case 'workflow:failed': {
                this.queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
                this.queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
                break;
            }
            default:
                break;
        }
    }

    private notifyListeners(event: SSEEvent): void {
        this.listeners.get(event.type)?.forEach(cb => {
            try {
                cb(event);
            } catch (err) {
                console.error('[SSEManager] Listener threw:', err);
            }
        });
    }

    private scheduleReconnect(): void {
        this.clearReconnectTimer();
        this.reconnectTimer = setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
            this.openConnection();
        }, this.reconnectDelay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}

export const sseManager = new SSEManager();