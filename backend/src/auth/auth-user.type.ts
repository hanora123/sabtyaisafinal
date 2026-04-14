import type { AppRole } from '../common/decorators/roles.decorator';

export type AuthUser = {
  id: string;
  email: string;
  roles: AppRole[];
};
