import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Chat } from './chat.entity.js';

@Entity('chat_members')
@Unique('UQ_chat_member', ['chatId', 'userId'])
export class ChatMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'chat_id' })
  chatId!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => Chat, (chat) => chat.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chat_id' })
  chat!: Relation<Chat>;

  @ManyToOne(() => User, (user) => user.chatMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;
}