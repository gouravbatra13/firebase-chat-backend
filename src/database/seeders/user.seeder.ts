import 'dotenv/config';
import { AppDataSource } from '../data-source.js';
import { User } from '../../users/entities/user.entity.js';

async function seedUsers() {
    try {
        await AppDataSource.initialize();

        const userRepository = AppDataSource.getRepository(User);

        const users = [
            { name: 'Gourav', email: 'gourav@test.com' },
            { name: 'Rahul', email: 'rahul@test.com' },
        ];

        for (const userData of users) {
            const existingUser = await userRepository.findOneBy({
                email: userData.email,
            });

            if (!existingUser) {
                await userRepository.save(userRepository.create(userData));
                console.log(`Created user: ${userData.email}`);
            } else {
                console.log(`User already exists: ${userData.email}`);
            }
        }

        console.log('User seeding completed!');
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exitCode = 1;
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

seedUsers();