/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAyWsxwImGp3eqaSngjpp6QF6uAxYqxLyw",
  authDomain: "escritorio-aero.firebaseapp.com",
  projectId: "escritorio-aero",
  storageBucket: "escritorio-aero.firebasestorage.app",
  messagingSenderId: "364878493045",
  appId: "1:364878493045:web:9d1491d8ff0bf1b4098f3c"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with persistent local cache (v10 SDK style)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Auth
export const auth = getAuth(app);
