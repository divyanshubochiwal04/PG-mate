/**
 * Pure TypeScript interface for base domain entity attributes.
 * All domain models share standard auditing timestamps.
 */
export interface BaseEntityProps {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare abstract class AggregateRoot<T extends BaseEntityProps> {
    protected readonly props: T;
    protected constructor(props: T);
    get id(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): T;
}
//# sourceMappingURL=base.entity.d.ts.map