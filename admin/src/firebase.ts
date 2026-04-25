import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC9kjuL-q39QlK0N1cAIOLMtTu5e6euVTY',
  authDomain: 'leadhangover.firebaseapp.com',
  projectId: 'leadhangover',
  storageBucket: 'leadhangover.firebasestorage.app',
  messagingSenderId: '561765519580',
  appId: '1:561765519580:web:1e44cad3f15e6637392419',
  measurementId: 'G-PSMK70HRWC',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
