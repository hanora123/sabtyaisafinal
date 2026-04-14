export class CreateUserDto {
  email!: string;
  username!: string;
  fullName!: string;
  password!: string;
  roles!: string[];
}
