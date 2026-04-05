import { Module } from '@nestjs/common';

import { ChatModule } from './chat/chat.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [ChatModule],
  providers: [PrismaService],
})
export class AppModule {}
