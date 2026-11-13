import {
  Body,
  Controller,
  Post,
  Param,
  ParseIntPipe,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

import { ChatService } from './chat.service.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@ApiTags('Chat')
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Create Chat
   * @param dto 
   * @returns 
   */
  @ApiOperation({
    summary: 'Create or get an existing private chat',
    description: 'Send two existing user IDs to create or retrieve a private chat.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        userAId: 1,
        userBId: 2,
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Chat created or existing chat returned' })
  @ApiResponse({ status: 404, description: 'One or both users not found' })
  @Post('chat/create')
  async createChat(@Body() dto: CreateChatDto) {
    return this.chatService.createChat(
      dto.userAId,
      dto.userBId,
    );
  }

  /**
   * Send Message
   * @param chatId 
   * @param dto 
   * @returns 
   */
  @ApiOperation({
    summary: 'Send a message in a chat',
    description: 'Provide chatId in URL and senderId and text in request body.',
  })
  @ApiParam({ name: 'chatId', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        senderId: 1,
        text: 'Hello Rahul!',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @Post('chat/:chatId/message/send')
  async sendMessage(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      chatId,
      dto.senderId,
      dto.text,
    );
  }

  /**
   * Get Message
   * @param chatId 
   * @param limit 
   * @returns 
   */
  @ApiOperation({
    summary: 'Get chat messages ordered by timestamp',
    description: 'Provide chatId in URL and optional limit in query. Default limit is 50.',
  })
  @ApiParam({ name: 'chatId', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @Get('chat/:chatId/messages')
  async getMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new BadRequestException(
        'Limit must be a positive integer',
      );
    }

    return this.chatService.getMessages(
      chatId,
      parsedLimit,
    );
  }

  /**
   * Mark Message As Read
   * @param chatId 
   * @param messageId 
   * @param userId 
   * @returns 
   */
  @ApiOperation({
    summary: 'Mark a message as read',
    description: 'Provide chatId and messageId in URL and userId in request body.',
  })
  @ApiParam({ name: 'chatId', type: Number, example: 1 })
  @ApiParam({
    name: 'messageId',
    type: String,
    example: 'pvIYPH8sMs0x9Hq1So1D',
  })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        userId: 2,
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Read receipt updated successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @Post('chat/:chatId/message/:messageId/read')
  async markMessageRead(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('messageId') messageId: string,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.markMessageRead(
      chatId,
      messageId,
      userId,
    );
  }

  /**
   * Update Last Seen
   * @param chatId 
   * @param body 
   * @returns 
   */
  @ApiOperation({
    summary: 'Update user last seen message',
    description: 'Provide chatId in URL and userId and messageId in request body.',
  })
  @ApiParam({ name: 'chatId', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        userId: 2,
        messageId: 'pvIYPH8sMs0x9Hq1So1D',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Last seen updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot move last seen backwards' })
  @Post('chat/:chatId/lastseen')
  async updateLastSeen(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() body: { userId: number; messageId: string },
  ) {
    return this.chatService.updateLastSeen(
      chatId,
      body.userId,
      body.messageId,
    );
  }

  /**
   * List User Chats
   * @param userId 
   * @returns 
   */
  @ApiOperation({
    summary: 'Get all chats for a user',
    description: 'Provide userId in URL to retrieve the user chat list.',
  })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'User chats retrieved successfully' })
  @Get('user/:userId/chats')
  async getUserChats(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.getUserChats(userId);
  }
}