import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, varchar, bigint, timestamp } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';

// Vercel Postgres connection
const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is not set.');
}

const client = postgres(connectionString, { ssl: 'require' });
const db = drizzle(client);

// Table schema definitions
const users = pgTable('User', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 64 }),
  password: varchar('password', { length: 64 }),
  name: varchar('name', { length: 64 }),
});

const coverletters = pgTable('Coverletter', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  cid: varchar('CID', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export async function getUser(email: string) {
  return await db.select().from(users).where(eq(users.email, email));
}

export async function createUser(email: string, password: string, name: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  return await db.insert(users).values({ email, password: hash, name });
}

export async function saveCoverletter(userId: number, cid: string, filePath: string) {
  // Check if a record with the same CID exists
  const existingRecord = await db.select().from(coverletters).where(eq(coverletters.cid, cid));
  
  if (existingRecord.length > 0) {
    // Return null if CID already exists
    return null;
  } else {
    // Add new record
    return await db.insert(coverletters).values({
      userId,
      cid,
      filePath,
    });
  }
}

export async function getCoverletter(userId: number) {
  return await db.select().from(coverletters).where(eq(coverletters.userId, userId));
}

async function ensureTablesExist() {
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "User" (
        id SERIAL PRIMARY KEY,
        email VARCHAR(64) UNIQUE,
        password VARCHAR(64),
        name VARCHAR(64)
      );`;
  } else {
    // 테이블이 존재하는 경우 name 컬럼이 있는지 확인
    const columnCheck = await client`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'User'
        AND column_name = 'name'
      );`;

    if (!columnCheck[0].exists) {
      // name 컬럼이 없으면 추가
      await client`
        ALTER TABLE "User"
        ADD COLUMN name VARCHAR(64);`;
    }
  }

  const coverletterResult = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Coverletter'
    );`;

  if (!coverletterResult[0].exists) {
    await client`
      CREATE TABLE "Coverletter" (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        CID VARCHAR(255) NOT NULL,
        file_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES "User" (id)
      );`;
  }
}

// Verify table creation
ensureTablesExist();
