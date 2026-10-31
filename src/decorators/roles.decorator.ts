import { SetMetadata } from '@nestjs/common';

import { userType } from '../constants/app.constants';

export const ROLES_KEY = 'roles';

/** Usage: @UseGuards(JwtAuthGuard, RolesGuard) @Roles(userType.admin) */
export const Roles = (...roles: userType[]) => SetMetadata(ROLES_KEY, roles);
