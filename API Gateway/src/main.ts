import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Proxy for Auth Service
  app.use(
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL,
      changeOrigin: true,
      pathFilter: ['/auth', '/user'],
    }),
  );

  // Proxy for Application Service
  app.use(
    createProxyMiddleware({
      target: process.env.APPLICATION_SERVICE_URL,
      changeOrigin: true,
      pathFilter: ['/applications', '/companies', '/jobs'],
    }),
  );

  // Proxy for Interview Service
  app.use(
    createProxyMiddleware({
      target: process.env.INTERVIEW_SERVICE_URL,
      changeOrigin: true,
      pathFilter: ['/interviews'],
    }),
  );

  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
