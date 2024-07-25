import { Module } from '@nestjs/common';
import { BusTransService } from './bus.service';
import { BusNavSerivce } from './navigate.service';
import { BusTransController } from './bus.controller';

@Module({
  imports: [],
  controllers: [BusTransController],
  providers: [BusTransService, BusNavSerivce],
})
export class BusTransModule {}
