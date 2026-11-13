import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1794474697152 implements MigrationInterface {
    name = 'InitialSchema1794474697152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`chats\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('private', 'group') NOT NULL DEFAULT 'private', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chat_members\` (\`id\` int NOT NULL AUTO_INCREMENT, \`chat_id\` int NOT NULL, \`user_id\` int NOT NULL, \`joined_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`UQ_chat_member\` (\`chat_id\`, \`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`chat_members\` ADD CONSTRAINT \`FK_29ffb4b6edf59a7862129765339\` FOREIGN KEY (\`chat_id\`) REFERENCES \`chats\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat_members\` ADD CONSTRAINT \`FK_9dc61e92eed1dc151c2b2ef01a0\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`chat_members\` DROP FOREIGN KEY \`FK_9dc61e92eed1dc151c2b2ef01a0\``);
        await queryRunner.query(`ALTER TABLE \`chat_members\` DROP FOREIGN KEY \`FK_29ffb4b6edf59a7862129765339\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`UQ_chat_member\` ON \`chat_members\``);
        await queryRunner.query(`DROP TABLE \`chat_members\``);
        await queryRunner.query(`DROP TABLE \`chats\``);
    }

}
