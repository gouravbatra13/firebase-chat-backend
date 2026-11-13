Chat Backend

This project is a backend for a one-to-one chat application. I built it using NestJS, TypeScript, MySQL, and Firebase Firestore.

The project handles chat creation, sending messages, fetching chat history, read receipts, and last-seen updates.

Technologies Used

Node.js

NestJS

TypeScript

MySQL

TypeORM

Firebase Firestore

Firebase Admin SDK

Swagger

Features

Create a private chat between two users.

Return an existing chat if one already exists.

Send messages and store them in Firestore.

Fetch messages in timestamp order.

Mark messages as read.

Update the last-seen message for each user.

Get all chats of a user with member IDs.

Installation

Clone the repository:

git clone YOUR_GITHUB_REPOSITORY_URL
cd chat-backend

Install the dependencies:

npm install

Environment Setup

Create a .env file in the root directory and add the following configuration:

PORT=3004

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=db_name

FIREBASE_SERVICE_ACCOUNT_PATH=./file.json

Update the database details according to your MySQL configuration.

MySQL Setup

Start MySQL using XAMPP.

Open phpMyAdmin.

Create a database named chat_backend.

Run the database migrations:

npx typeorm-ts-node-esm migration:run -d src/database/data-source.ts

Firebase Setup

Create a project in Firebase Console.

Enable Cloud Firestore.

Generate a service account key.

Download the JSON file.

Place the file in the project root with the name firebase-service-account.json.

Make sure the file path is correctly configured in .env.

Do not upload the Firebase service account file to GitHub.

Seed Users

To insert sample users into the database, run:

npm run seed:users

Run the Project

For development:

npm run start:dev

To create a production build:

npm run build


API Endpoints

1. Create or Get Chat

POST /chat/create

Request body:

{
  "userAId": 1,
  "userBId": 2
}

Returns the chat ID. If a chat already exists between the users, it returns the existing chat ID.

2. Send Message

POST /chat/:chatId/message/send

Request body:

{
  "senderId": 1,
  "text": "Hello Rahul!"
}

Saves the message in Firebase Firestore with its timestamp.

3. Get Messages

GET /chat/:chatId/messages?limit=50

Returns messages of the selected chat, ordered by timestamp. The default limit is 50.

4. Mark Message as Read

POST /chat/:chatId/message/:messageId/read

Request body:

{
  "userId": 2
}

Updates the read receipt of the selected message.

5. Update Last Seen

POST /chat/:chatId/lastseen

Request body:

{
  "userId": 2,
  "messageId": "FIRESTORE_MESSAGE_ID"
}

Updates the last-seen message for the specified user. Moving the last-seen position to an older message is not allowed.

6. Get User Chats

GET /user/:userId/chats

Example:

/user/1/chats

Returns the chats associated with the user, including chat member IDs.

Swagger Documentation

I have added Swagger to test and view the API endpoints.

After starting the application, open:

http://localhost:3004/api/docs

You can check the request parameters, example request bodies, and API responses from this page.

Database Tables

The project uses the following MySQL tables:

users

chats

chat_members

migrations

Messages and read receipts are stored separately in Firebase Firestore.
