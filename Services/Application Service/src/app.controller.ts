import { Controller, Get, Inject, OnModuleInit, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { lastValueFrom, Observable } from 'rxjs';
import * as microservices from '@nestjs/microservices';

@Controller()
export class AppController {
  // private heroService!: HeroService;
  constructor(
    private readonly appService: AppService,
    // @Inject('HERO_PACKAGE') private client: microservices.ClientGrpc,
  ) {}
  // onModuleInit() {
  //   // throw new Error('Method not implemented.');
  //   this.heroService = this.client.getService<HeroService>('HeroesService');
  // }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Get('check-item')
  // async checkItem(@Query('pid') pid: string) {
  //   const id = Number.parseInt(pid);
  //   const stockStatus = await lastValueFrom(
  //     this.heroService.FindOne({
  //       id,
  //     }),
  //   );
  //   return stockStatus;
  // }
}
