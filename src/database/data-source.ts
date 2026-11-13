import 'dotenv/config';

import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity.js';
import { Chat } from '../chat/entities/chat.entity.js';
import { ChatMember } from '../chat/entities/chat-member.entity.js';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'chat_backend',

    entities: [User, Chat, ChatMember],

    migrations: ['src/database/migrations/*.ts'],

    synchronize: false,
    logging: true,
});