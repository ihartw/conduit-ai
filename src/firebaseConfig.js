import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { ref as dbRef, set, push } from 'firebase/database';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_APP_FIREBASE_KEY,
    authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_APP_FIREBASE_URL,
    projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_APP_FIREBASE_BUCKET,
    messagingSenderId: import.meta.env.VITE_APP_FIREBASE_SENDER_ID,
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Realtime Database and export it
const database = getDatabase(firebaseApp);
const storeConversation = async (userInput, rickResponse) => {
    try {
        const newItemRef = push(dbRef(database, 'chats'));
        await set(newItemRef, {
            userInput: userInput,
            rickResponse: rickResponse,
        });
    } catch (error) {
        console.error('Error adding data:', error);
    }
};

export { storeConversation };