'use server';

import { getUser, createUser } from '@/db';
import { signIn } from '@/auth';

export async function checkPassword(password: string, confirmPassword: string) {
  try {
    if (password !== confirmPassword) {
      return { error: 'Passwords do not match.' };
    }
    return { error: null };
  } catch (err) {
    console.error(err);
    return { error: 'An error occurred while checking the email.' };
  }
}

export async function checkEmail(email: string) {
  try {
    const existingUser = await getUser(email);
    if (existingUser.length > 0) {
      return { error: 'This email already exists.' };
    }
    return { error: null };
  } catch (err) {
    console.error(err);
    return { error: 'An error occurred while checking the email.' };
  }
}

export async function signup(
  state: null,
  payload: { email: string; password: string }
): Promise<null> {
  try {
    await createUser(payload.email, payload.password);
    await signIn('credentials', {
      email: payload.email,
      password: payload.password,
      redirectTo: '/',
    });
    return null;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function login(
  state: null,
  payload: { email: string; password: string }
): Promise<null> {
  try {
    await signIn('credentials', {
      email: payload.email,
      password: payload.password,
      redirectTo: '/',
    });

    return null;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function signInWithGoogle() {
  try {
    await signIn('google', {
      redirectTo: '/',
      redirect: true,
      callbackUrl: '/',
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}
