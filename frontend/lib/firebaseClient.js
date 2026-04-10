import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDpJu3xQJkNT8PU1QuZy9Z9IoLECAofvwI',
  authDomain: 'campus-flow-as-a-service-50de2.firebaseapp.com',
  projectId: 'campus-flow-as-a-service-50de2',
  storageBucket: 'campus-flow-as-a-service-50de2.firebasestorage.app',
  messagingSenderId: '895744101915',
  appId: '1:895744101915:web:6f97fe627c5757d48932be',
  measurementId: 'G-GBMNW36Q14',
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const firestore = getFirestore();
