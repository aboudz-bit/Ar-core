import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyGuard } from '../common/guards/company.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Role, createUserSchema, updateUserSchema, CreateUserInput, UpdateUserInput } from '@ar-core/shared';

@Controller('users')
@UseGuards(AuthGuard('jwt'), CompanyGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.usersService.findAll(companyId, Number(page) || 1, Number(limit) || 20);
    return { success: true, ...data };
  }

  @Post()
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @UsePipes(new ZodValidationPipe(createUserSchema))
  async create(@CurrentUser('companyId') companyId: string, @Body() body: CreateUserInput) {
    const user = await this.usersService.create(companyId, body);
    return { success: true, data: user };
  }

  @Patch(':id')
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  async update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserInput,
  ) {
    const user = await this.usersService.update(companyId, id, body);
    return { success: true, data: user };
  }

  @Delete(':id')
  @Roles(Role.COMPANY_OWNER)
  async delete(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    await this.usersService.delete(companyId, id);
    return { success: true, message: 'تم حذف المستخدم' };
  }
}
