import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  requestId: string;
  correlationId: string;
  userId?: string;
  organizationId?: string;
}

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextStore>();

  public static run<R>(store: RequestContextStore, callback: () => R): R {
    return this.storage.run(store, callback);
  }

  public static current(): RequestContextStore | undefined {
    return this.storage.getStore();
  }

  public static get requestId(): string {
    return this.current()?.requestId ?? 'system';
  }
}
