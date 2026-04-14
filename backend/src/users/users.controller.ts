import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('Admin')
  list() {
    return this.usersService.listUsers();
  }

  @Get(':id')
  @Roles('Admin')
  getOne(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post()
  @Roles('Admin')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Put(':id')
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }
}
