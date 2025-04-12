import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, varchar, bigint, timestamp, text, json } from 'drizzle-orm/pg-core';
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

// Define metadata interface
interface ResumeMetadata {
  jobTitle?: string;
  companyName?: string;
  yearsOfExperience?: string;
  skills?: string;
  additionalInfo?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  uploadDate?: string;
}

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
  jobTitle: varchar('job_title', { length: 255 }),
  companyName: varchar('company_name', { length: 255 }),
  yearsOfExperience: varchar('years_of_experience', { length: 100 }),
  skills: text('skills'),
  additionalInfo: text('additional_info'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: bigint('file_size', { mode: 'number' }),
  fileType: varchar('file_type', { length: 100 }),
  metadata: json('metadata'),
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

export async function saveCoverletter(
  userId: number,
  cid: string,
  filePath: string,
  metadataStr?: string
) {
  // Check if a record with the same CID exists
  const existingRecord = await db.select().from(coverletters).where(eq(coverletters.cid, cid));

  console.log('existingRecord', existingRecord);

  let metadata = {};
  let metadataObj: ResumeMetadata = {};

  // Parse metadata if provided
  if (metadataStr) {
    try {
      metadataObj = JSON.parse(metadataStr) as ResumeMetadata;
      metadata = metadataObj;
    } catch (error) {
      console.error('Error parsing metadata:', error);
    }
  }

  return await db.insert(coverletters).values({
    userId,
    cid,
    filePath,
    jobTitle: metadataObj.jobTitle || null,
    companyName: metadataObj.companyName || null,
    yearsOfExperience: metadataObj.yearsOfExperience || null,
    skills: metadataObj.skills || null,
    additionalInfo: metadataObj.additionalInfo || null,
    fileName: metadataObj.fileName || null,
    fileSize: metadataObj.fileSize || null,
    fileType: metadataObj.fileType || null,
    metadata: metadata,
  });
}

export async function getCoverletter(userId: number) {
  return await db.select().from(coverletters).where(eq(coverletters.userId, userId));
}

export async function getCoverletterById(id: number) {
  return await db.select().from(coverletters).where(eq(coverletters.id, id));
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
        job_title VARCHAR(255),
        company_name VARCHAR(255),
        years_of_experience VARCHAR(100),
        skills TEXT,
        additional_info TEXT,
        file_name VARCHAR(255),
        file_size BIGINT,
        file_type VARCHAR(100),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES "User" (id)
      );`;
  } else {
    // 테이블이 존재하는 경우 메타데이터 관련 컬럼이 있는지 확인 및 추가
    const columns = [
      'job_title',
      'company_name',
      'years_of_experience',
      'skills',
      'additional_info',
      'file_name',
      'file_size',
      'file_type',
      'metadata',
    ];

    for (const column of columns) {
      const columnCheck = await client`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'Coverletter'
          AND column_name = ${column}
        );`;

      if (!columnCheck[0].exists) {
        // 컬럼 타입 지정
        let columnType = 'VARCHAR(255)';
        if (column === 'skills' || column === 'additional_info') columnType = 'TEXT';
        if (column === 'file_size') columnType = 'BIGINT';
        if (column === 'metadata') columnType = 'JSONB';
        if (column === 'years_of_experience' || column === 'file_type') columnType = 'VARCHAR(100)';

        // 컬럼 추가
        await client`
          ALTER TABLE "Coverletter"
          ADD COLUMN ${client.unsafe(column)} ${client.unsafe(columnType)};`;
      }
    }
  }
}

// Verify table creation
ensureTablesExist();
