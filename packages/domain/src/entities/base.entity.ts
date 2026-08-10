/**
 * Pure TypeScript interface for base domain entity attributes.
 * All domain models share standard auditing timestamps.
 */
export interface BaseEntityProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class AggregateRoot<T extends BaseEntityProps> {
  protected constructor(protected readonly props: T) {}

  public get id(): string {
    return this.props.id;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public toJSON(): T {
    return { ...this.props };
  }
}
