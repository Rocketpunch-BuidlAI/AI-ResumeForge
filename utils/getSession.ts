'use server';

import { auth } from '@/auth';

const getSession = async () => {
  const session = await auth();
  return session;
};

export default getSession;
