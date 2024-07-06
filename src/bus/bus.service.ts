import { Injectable, Param, Query } from '@nestjs/common';
import { ChildProcess, exec, spawn } from 'child_process';
import navigate from 'src/util/navigate';

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
    const route: object[] = await navigate(depTmn, arrTmn, depHour, depMin);
    return route;
  }
}
