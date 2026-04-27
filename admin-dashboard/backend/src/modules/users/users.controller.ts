import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
  @Get('count')
  async getCount() {
    const total = await this.usersService.countAll();
    return total;
  }

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    
    console.log(`[PAGINATION_DEBUG] Page: ${pageNumber}, Limit: ${limitNumber}`);

    const [data, total] = await Promise.all([
      this.usersService.findAll(pageNumber, limitNumber),
      this.usersService.countAll(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
