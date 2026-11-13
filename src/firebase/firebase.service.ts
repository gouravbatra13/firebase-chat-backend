import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

import { initializeApp, getApps, cert } from 'firebase-admin/app';

import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private firestore!: Firestore;

    private readonly logger = new Logger(FirebaseService.name);

    onModuleInit(): void {
        const existingApp = getApps()[0];

        const app =
            existingApp ??
            initializeApp({
                credential: cert(
                    JSON.parse(
                        readFileSync(
                            resolve(
                                process.cwd(),
                                process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
                                './firebase-service-account.json',
                            ),
                            'utf8',
                        ),
                    ),
                ),
            });

        this.firestore = getFirestore(app);

        this.logger.log('Firebase Firestore initialized successfully');
    }

    getFirestore(): Firestore {
        return this.firestore;
    }
}