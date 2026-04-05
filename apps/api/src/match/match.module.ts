import { Module } from '@nestjs/common';

import { RedisService } from '../chat/redis.service';

import { MatchService } from './match.service';

@Module({
  providers: [RedisService, MatchService],
  exports: [MatchService],
})
export class MatchModule {}
