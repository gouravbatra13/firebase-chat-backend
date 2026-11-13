import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Chat } from './entities/chat.entity.js';
import { ChatMember } from './entities/chat-member.entity.js';
import { User } from '../users/entities/user.entity.js';

import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { FirebaseModule } from '../firebase/firebase.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatMember, User]),
    FirebaseModule
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}