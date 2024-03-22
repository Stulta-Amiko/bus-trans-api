import { Controller, Get, Param, Query } from '@nestjs/common';
import { BusTransService } from './bus.service';

@Controller('bustrans')
export class BusTransController {
  constructor(private readonly busTransService: BusTransService) {}

  @Get()
  getTest(): string {
    console.log('test');
    return this.busTransService.getTest();
  }

  @Get('bus')
  getBus(
    @Query('depTmn') depTmn: any,
    @Query('arrTmn') arrTmn: any,
    @Query('depHour') depHour: any,
    @Query('depMin') depMin: any,
  ): Promise<string> {
    return this.busTransService.getBusTrans(depTmn, arrTmn, depHour, depMin);
  }
}
