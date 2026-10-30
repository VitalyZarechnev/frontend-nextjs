export class EventBus<Events extends Record<string, unknown>> {
  private bus: EventTarget;

  constructor() {
    this.bus = new EventTarget();
  }

  publish<T extends keyof Events>(eventName: T, ...args: Events[T] extends undefined ? [] : [payload: Events[T]]): void {
    const payload = args[0];

    const event = payload !== undefined ? new CustomEvent(eventName as string, { detail: payload }) : new CustomEvent(eventName as string);

    this.bus.dispatchEvent(event);
  }

  subscribe<T extends keyof Events>(eventName: T, handlerFn: (payload: Events[T]) => void): () => void {
    const eventHandler = (event: Event) => {
      if (this.isCustomEvent(event)) {
        const eventPayload: Events[T] = event.detail;
        handlerFn(eventPayload);
      }
    };

    this.bus.addEventListener(eventName as string, eventHandler);

    return () => {
      this.bus.removeEventListener(eventName as string, eventHandler);
    };
  }

  private isCustomEvent(event: Event): event is CustomEvent {
    return 'detail' in event;
  }
}
