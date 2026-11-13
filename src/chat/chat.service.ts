import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Chat, ChatType } from './entities/chat.entity.js';
import { ChatMember } from './entities/chat-member.entity.js';
import { User } from '../users/entities/user.entity.js';
import { FirebaseService } from '../firebase/firebase.service.js';
import {
    FieldValue,
    Timestamp,
} from 'firebase-admin/firestore';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,

        @InjectRepository(ChatMember)
        private readonly chatMemberRepository: Repository<ChatMember>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly firebaseService: FirebaseService,
    ) { }

    /**
     * Create Chat
     * @param userAId 
     * @param userBId 
     * @returns 
     */
    async createChat(userAId: number, userBId: number) {
        if (userAId === userBId) {
            throw new BadRequestException(
                'Users cannot create a chat with themselves',
            );
        }

        const users = await this.userRepository.findBy({
            id: In([userAId, userBId]),
        });

        if (users.length !== 2) {
            throw new NotFoundException(
                'One or both users not found',
            );
        }

        const existingChat = await this.chatRepository
            .createQueryBuilder('chat')
            .innerJoin('chat.members', 'member')
            .where('chat.type = :type', {
                type: ChatType.PRIVATE,
            })
            .andWhere('member.userId IN (:...userIds)', {
                userIds: [userAId, userBId],
            })
            .groupBy('chat.id')
            .having('COUNT(DISTINCT member.userId) = 2')
            .getOne();

        if (existingChat) {
            return { chatId: existingChat.id };
        }

        const chatId = await this.chatRepository.manager.transaction(
            async (manager) => {
                const chat = manager.create(Chat, {
                    type: ChatType.PRIVATE,
                });

                const savedChat = await manager.save(Chat, chat);

                const members = [userAId, userBId].map((userId) =>
                    manager.create(ChatMember, {
                        chatId: savedChat.id,
                        userId,
                    }),
                );

                await manager.save(ChatMember, members);

                return savedChat.id;
            },
        );

        return { chatId };
    }

    /**
     * Send Message
     * @param chatId 
     * @param senderId 
     * @param text 
     * @returns 
     */
    async sendMessage(
        chatId: number,
        senderId: number,
        text: string,
    ) {
        const chat = await this.chatRepository.findOneBy({
            id: chatId,
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        const membership = await this.chatMemberRepository.findOneBy({
            chatId,
            userId: senderId,
        });

        if (!membership) {
            throw new BadRequestException(
                'Sender is not a member of this chat',
            );
        }

        const cleanText = text.trim();

        if (!cleanText) {
            throw new BadRequestException(
                'Message text cannot be empty',
            );
        }

        const firestore = this.firebaseService.getFirestore();
        const timestamp = Timestamp.now();

        const messageRef = await firestore
            .collection('chats')
            .doc(String(chatId))
            .collection('messages')
            .add({
                senderId,
                text: cleanText,
                timestamp,
                readBy: [senderId],
                readAt: {
                    [senderId]: timestamp,
                },
            });

        return {
            messageId: messageRef.id,
            chatId,
            senderId,
            text: cleanText,
            timestamp: timestamp.toDate().toISOString(),
            message: 'Message sent successfully',
        };
    }
    
    /**
     * Get Messages
     * @param chatId 
     * @param limit 
     * @returns 
     */
    async getMessages(
        chatId: number,
        limit = 50,
    ) {
        const firestore = this.firebaseService.getFirestore();

        const snapshot = await firestore
            .collection('chats')
            .doc(String(chatId))
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(Math.min(Math.max(limit, 1), 100))
            .get();

        const messages = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const data = doc.data();

                const sender = await this.userRepository.findOne({
                    where: { id: data.senderId },
                    select: {
                        id: true,
                        name: true,
                    },
                });

                return {
                    messageId: doc.id,

                    sender: sender
                        ? {
                            id: sender.id,
                            name: sender.name,
                        }
                        : null,

                    text: data.text,
                    timestamp: data.timestamp?.toDate().toISOString(),
                    readBy: data.readBy ?? [],

                    readAt: Object.fromEntries(
                        Object.entries(data.readAt ?? {}).map(
                            ([readUserId, timestamp]) => [
                                readUserId,
                                (timestamp as Timestamp)
                                    .toDate()
                                    .toISOString(),
                            ],
                        ),
                    ),
                };
            }),
        );

        return {
            chatId,
            totalMessages: messages.length,
            messages,
        };
    }

    /**
     * Mark Message as Read
     * @param chatId 
     * @param messageId 
     * @param userId 
     * @returns 
     */
    async markMessageRead(
        chatId: number,
        messageId: string,
        userId: number,
    ) {
        const membership = await this.chatMemberRepository.findOneBy({
            chatId,
            userId,
        });

        if (!membership) {
            throw new BadRequestException(
                'You are not a member of this chat',
            );
        }

        const firestore = this.firebaseService.getFirestore();

        const messageRef = firestore
            .collection('chats')
            .doc(String(chatId))
            .collection('messages')
            .doc(messageId);

        const message = await messageRef.get();

        if (!message.exists) {
            throw new NotFoundException('Message not found');
        }

        const messageData = message.data()!;

        const alreadyRead = (
            messageData.readBy ?? []
        ).includes(userId);

        if (alreadyRead) {
            return {
                chatId,
                messageId,
                userId,
                alreadyRead: true,
                message: 'Message already read',
            };
        }

        await messageRef.update({
            readBy: FieldValue.arrayUnion(userId),
            [`readAt.${userId}`]: Timestamp.now(),
        });

        return {
            chatId,
            messageId,
            userId,
            alreadyRead: false,
            message: 'Message marked as read successfully',
        };
    }

    /**
     * Update Last Seen
     * @param chatId 
     * @param userId 
     * @param messageId 
     * @returns 
     */
    async updateLastSeen(
        chatId: number,
        userId: number,
        messageId: string,
    ) {
        const membership = await this.chatMemberRepository.findOneBy({
            chatId,
            userId,
        });

        if (!membership) {
            throw new BadRequestException(
                'You are not a member of this chat',
            );
        }

        const firestore = this.firebaseService.getFirestore();

        const chatRef = firestore
            .collection('chats')
            .doc(String(chatId));

        const messageRef = chatRef
            .collection('messages')
            .doc(messageId);

        const message = await messageRef.get();

        if (!message.exists) {
            throw new NotFoundException('Message not found');
        }

        const messageData = message.data()!;

        const lastSeenRef = chatRef
            .collection('lastSeen')
            .doc(String(userId));

        const existingLastSeen = await lastSeenRef.get();

        if (existingLastSeen.exists) {
            const existingData = existingLastSeen.data()!;

            const existingTimestamp =
                existingData.lastSeenMessageTimestamp as Timestamp;

            const newTimestamp =
                messageData.timestamp as Timestamp;

            if (
                existingTimestamp &&
                newTimestamp &&
                newTimestamp.toMillis() <
                existingTimestamp.toMillis()
            ) {
                throw new BadRequestException(
                    'Last seen cannot move to an older message',
                );
            }
        }

        const lastSeenAt = Timestamp.now();

        await lastSeenRef.set({
            userId,
            messageId,
            lastSeenAt,
            lastSeenMessageTimestamp: messageData.timestamp,
        });

        return {
            chatId,
            userId,
            messageId,
            lastSeenAt: lastSeenAt.toDate().toISOString(),
            message: 'Last seen updated successfully',
        };
    }

    /**
     * List User Chats
     * @param userId 
     * @returns 
     */
    async getUserChats(userId: number) {
        const user = await this.userRepository.findOneBy({
            id: userId,
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const memberships = await this.chatMemberRepository.find({
            where: { userId },
            relations: {
                chat: {
                    members: {
                        user: true,
                    },
                },
            },
            order: {
                joinedAt: 'DESC',
            },
        });

        return {
            userId,
            totalChats: memberships.length,

            chats: memberships.map((membership) => {
                const members = membership.chat.members;

                const otherMembers = members.filter(
                    (member) => member.userId !== userId,
                );

                const otherUsers = otherMembers.map((member) => ({
                    id: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                }));

                return {
                    chatId: membership.chat.id,
                    type: membership.chat.type,
                    memberIds: members.map(
                        (member) => member.userId,
                    ),
                    chatName:
                        membership.chat.type === ChatType.PRIVATE
                            ? otherUsers[0]?.name ?? 'Unknown User'
                            : 'Group Chat',
                    otherUsers,
                    createdAt: membership.chat.createdAt,
                };
            }),
        };
    }

}