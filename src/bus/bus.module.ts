import { Module } from '@nestjs/common';
import { BusTransService } from './bus.service';
import { BusTransController } from './bus.controller';

@Module({
  imports: [],
  controllers: [BusTransController],
  providers: [BusTransService],
})
export class BusTransModule {}
