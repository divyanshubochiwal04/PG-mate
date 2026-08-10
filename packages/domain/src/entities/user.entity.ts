import { AggregateRoot, type BaseEntityProps } from './base.entity';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface UserProps extends BaseEntityProps {
  email: string;
  passwordHash: string;
  status: UserStatus;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
}

export class UserEntity extends AggregateRoot<UserProps> {
  public static create(props: UserProps): UserEntity {
    return new UserEntity(props);
  }

  public get email(): string {
    return this.props.email;
  }

  public get passwordHash(): string {
    return this.props.passwordHash;
  }

  public get status(): UserStatus {
    return this.props.status;
  }

  public get emailVerifiedAt(): Date | undefined {
    return this.props.emailVerifiedAt;
  }

  public get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  public isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }
}
