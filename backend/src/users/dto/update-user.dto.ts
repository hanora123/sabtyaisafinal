export class UpdateUserDto {
  email?: string;
  username?: string;
  fullName?: string;
  password?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  roles?: string[];
}
