import { AggregateRoot, type BaseEntityProps } from './base.entity';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
export interface UserProps extends BaseEntityProps {
    email: string;
    passwordHash: string;
    status: UserStatus;
    emailVerifiedAt?: Date;
    lastLoginAt?: Date;
}
export declare class UserEntity extends AggregateRoot<UserProps> {
    static create(props: UserProps): UserEntity;
    get email(): string;
    get passwordHash(): string;
    get status(): UserStatus;
    get emailVerifiedAt(): Date | undefined;
    get lastLoginAt(): Date | undefined;
    isActive(): boolean;
}
//# sourceMappingURL=user.entity.d.ts.map