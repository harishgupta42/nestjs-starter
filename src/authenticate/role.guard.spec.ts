import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { userType } from '../constants/app.constants';
import { RolesGuard } from './role.guard';

function contextFor(user: any): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function reflectorReturning(roles: userType[] | undefined): Reflector {
  return { getAllAndOverride: jest.fn().mockReturnValue(roles) } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('allows routes without @Roles metadata', () => {
    expect(new RolesGuard(reflectorReturning(undefined)).canActivate(contextFor({ type: userType.user }))).toBe(true);
  });

  it('allows a principal whose type is listed', () => {
    expect(new RolesGuard(reflectorReturning([userType.admin])).canActivate(contextFor({ type: userType.admin }))).toBe(
      true,
    );
  });

  it('rejects a principal whose type is not listed, or no principal', () => {
    const guard = new RolesGuard(reflectorReturning([userType.admin]));
    expect(guard.canActivate(contextFor({ type: userType.user }))).toBe(false);
    expect(guard.canActivate(contextFor(undefined))).toBe(false);
  });
});
