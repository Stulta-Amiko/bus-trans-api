import { Injectable, Param, Query } from '@nestjs/common';
import { BusNavSerivce } from './navigate.service';

const navService = new BusNavSerivce();
@Injectable()
export class BusTransService {
  constructor() {}

  getTest(): string {
    return 'test return';
  }

  async getBusTrans(
    @Query('depTmn') depTmn: any,
    @Query('arrTmn') arrTmn: any,
    @Query('depHour') depHour: any,
    @Query('depMin') depMin: any,
  ): Promise<object[]> {
    //const route: object[] = await navigate(depTmn, arrTmn, depHour, depMin);
    const route: object[] = await navService.navigate(
      depTmn,
      arrTmn,
      depHour,
      depMin,
    );
    return route;
  }
}
