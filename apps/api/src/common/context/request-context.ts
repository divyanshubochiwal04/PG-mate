import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  requestId: string;
  correlationId: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
}

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextData>();

  public static run<T>(data: RequestContextData, callback: () => T): T {
    return this.storage.run(data, callback);
  }

  public static get current(): RequestContextData | undefined {
    return this.storage.getStore();
  }

  public static get requestId(): string | undefined {
    return this.current?.requestId;
  }

  public static get correlationId(): string | undefined {
    return this.current?.correlationId;
  }

  public static get userId(): string | undefined {
    return this.current?.userId;
  }

  public static get organizationId(): string | undefined {
    return this.current?.organizationId;
  }

  public static get sessionId(): string | undefined {
    return this.current?.sessionId;
  }

  public static setOrganizationId(organizationId: string): void {
    const store = this.current;
    if (store) {
      store.organizationId = organizationId;
    }
  }

  public static setUserId(userId: string): void {
    const store = this.current;
    if (store) {
      store.userId = userId;
    }
  }
}
