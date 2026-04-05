import { Module } from '@nestjs/common';

import { MatchService } from '../match/match.service';

import { ChatGateway } from './chat.gateway';
import { RedisService } from './redis.service';

@Module({
  providers: [RedisService, MatchService, ChatGateway],
  exports: [RedisService],
})
export class ChatModule {}
