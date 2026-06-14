import { redisSubscriber } from "@/lib/db/redis";

export interface EventSubscriber {
  subscribe(...channels: string[]): Promise<void>;
  onMessage(handler: (channel: string, data: unknown) => void): void;
  unsubscribe(...channels: string[]): Promise<void>;
}

export class WorkflowBus {
  private handlers: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(private subscriber: EventSubscriber) {
    this.subscriber.onMessage((channel, data) => {
      this.handlers.get(channel)?.forEach((h) => {
        h(data);
      });
    });
  }

  async subscribe(...events: string[]): Promise<void> {
    await this.subscriber.subscribe(...events);
  }

  on(event: string, handler: (data: unknown) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)?.add(handler);
  }

  off(event: string, handler?: (data: unknown) => void): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
      if (this.handlers.get(event)?.size === 0) {
        this.handlers.delete(event);
        this.subscriber.unsubscribe(event);
      }
    } else {
      this.handlers.delete(event);
      this.subscriber.unsubscribe(event);
    }
  }
}

export const workflowBus = new WorkflowBus(redisSubscriber);
