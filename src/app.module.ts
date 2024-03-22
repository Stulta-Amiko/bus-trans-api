import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BusTransModule } from './bus/bus.module';

@Module({
  imports: [BusTransModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
