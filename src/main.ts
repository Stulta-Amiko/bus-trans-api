import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  let disableKeepAlive = false;
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  process.on('SIGINT', async () => {
    disableKeepAlive = true;
    await app.close();
    process.exit(0);
  });

  await app.listen(process.env.FIRST_PORT, () => {
    console.log('서버시작');
    process.send('ready');
  });
}
bootstrap();
