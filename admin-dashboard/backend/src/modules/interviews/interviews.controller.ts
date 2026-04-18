import { Controller, Get, Param, Query } from '@nestjs/common';
import { InterviewsService } from './interviews.service';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get()
  async findAll(@Query('page') page: string) {
    const pageNumber = parseInt(page, 10) || 1;
    const interviews = await this.interviewsService.findAll(pageNumber);
    const total = await this.interviewsService.countAll();
    
    return {
      interviews,
      total,
      page: pageNumber,
      hasMore: total > pageNumber * 10,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.interviewsService.findOne(id);
  }
}
