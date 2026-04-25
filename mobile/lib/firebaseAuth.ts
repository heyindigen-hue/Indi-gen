import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

let currentConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

export type FirebaseLinkedUser = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: string;
  needs_onboarding?: boolean;
};

export type FirebaseLinkResponse = {
  token: string;
  user: FirebaseLinkedUser;
  needs_onboarding?: boolean;
};

export async function sendOTP(phone: string): Promise<void> {
  const normalized = phone.trim();
  if (!normalized.startsWith('+')) {
    throw new Error('Phone number must be in international format (e.g. +91…)');
  }
  currentConfirmation = await auth().signInWithPhoneNumber(normalized);
}

export async function verifyOTP(code: string): Promise<string> {
  if (!currentConfirmation) {
    throw new Error('No OTP request in progress. Please request a new code.');
  }
  const credential = await currentConfirmation.confirm(code);
  if (!credential || !credential.user) {
    throw new Error('Verification failed. Please try again.');
  }
  const idToken = await credential.user.getIdToken(true);
  currentConfirmation = null;
  return idToken;
}

export async function linkBackend(idToken: string): Promise<FirebaseLinkResponse> {
  const res = await api.post<FirebaseLinkResponse>('/auth/firebase-verify', { idToken });
  const data = res.data;
  if (!data?.token) {
    throw new Error('Backend did not return a session token');
  }
  await SecureStore.setItemAsync('leadhangover_token', data.token);
  return data;
}

export function clearOTPState(): void {
  currentConfirmation = null;
}
