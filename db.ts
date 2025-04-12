import { drizzle } from 'drizzle-orm/postgres-js';
import {
  pgTable,
  serial,
  varchar,
  bigint,
  timestamp,
  text,
  json,
  integer,
  doublePrecision,
  boolean,
} from 'drizzle-orm/pg-core';
import { eq, and, desc, inArray } from 'drizzle-orm';
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';

// Vercel Postgres connection
const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is not set.');
}

const client = postgres(connectionString, { ssl: 'require' });
export const db = drizzle(client);

// Define metadata interface
export interface ResumeMetadata {
  jobTitle?: string;
  companyName?: string;
  yearsOfExperience?: string;
  skills?: string;
  additionalInfo?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  uploadDate?: string;
  jobCategory?: string;
  jobSubcategory?: string;
  jobSpecific?: string;
}

// Table schema definitions
export const users = pgTable('User', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 64 }),
  password: varchar('password', { length: 64 }),
  name: varchar('name', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  jobCategory: varchar('job_category', { length: 255 }),
  jobSubcategory: varchar('job_subcategory', { length: 255 }),
  jobSpecific: varchar('job_specific', { length: 255 }),
  metadata: json('metadata'),
  aiGenerated: boolean('ai_generated').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// IP Asset Registration Information Table
const ipAssets = pgTable('Ip', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  tokenId: bigint('token_id', { mode: 'number' }).notNull(),
  licenseTermId: bigint('license_term_id', { mode: 'number' }).notNull(),
  cid: varchar('cid', { length: 255 }).notNull(),
  ipId: varchar('ip_id', { length: 255 }).notNull(),
  txHash: varchar('tx_hash', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// IP Asset Reference Information Table
const ipReferences = pgTable('IpReferences', {
  id: serial('id').primaryKey().notNull(),
  owner_ip_id: bigint('owner_ip_id', { mode: 'number' }).notNull(),
  reference_ip_id: bigint('reference_ip_id', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 이력서 텍스트 저장 테이블
const coverletterTexts = pgTable('CoverletterText', {
  id: serial('id').primaryKey(),
  coverletterId: bigint('coverletter_id', { mode: 'number' }).notNull(),
  text: text('text').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Royalty Information Table
const royalties = pgTable('Royalty', {
  id: serial('id').primaryKey(),
  parentIpId: bigint('parent_ip_id', { mode: 'number' }).notNull(),
  childIpId: bigint('child_ip_id', { mode: 'number' }).notNull(),
  amount: doublePrecision('amount'),
  txHash: varchar('tx_hash', { length: 255 }).notNull(),
  revenueReceipt: varchar('revenue_receipt', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

const coverletterReferences = pgTable('CoverletterReferences', {
  id: serial('id').primaryKey(),
  coverletterId: integer('coverletter_id')
    .notNull()
    .references(() => coverletters.id),
  referencedCoverletterId: integer('referenced_coverletter_id')
    .notNull()
    .references(() => coverletters.id),
  contribution: integer('contribution').notNull(),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export async function getUser(email: string) {
  return await db.select().from(users).where(eq(users.email, email));
}

export async function getUserById(id: number) {
  return await db.select().from(users).where(eq(users.id, id));
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
  metadataStr?: string,
  aiGenerated?: boolean
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

  // 계층적 직업 정보 로깅
  console.log('Saving job info to database:', {
    jobTitle: metadataObj.jobTitle || null,
    jobCategory: metadataObj.jobCategory || null,
    jobSubcategory: metadataObj.jobSubcategory || null,
    jobSpecific: metadataObj.jobSpecific || null,
  });

  const result = await db
    .insert(coverletters)
    .values({
      userId,
      cid,
      filePath,
      jobTitle: metadataObj.jobTitle || null,
      jobCategory: metadataObj.jobCategory || null,
      jobSubcategory: metadataObj.jobSubcategory || null,
      jobSpecific: metadataObj.jobSpecific || null,
      companyName: metadataObj.companyName || null,
      yearsOfExperience: metadataObj.yearsOfExperience || null,
      skills: metadataObj.skills || null,
      additionalInfo: metadataObj.additionalInfo || null,
      fileName: metadataObj.fileName || null,
      fileSize: metadataObj.fileSize || null,
      fileType: metadataObj.fileType || null,
      metadata: metadata,
      aiGenerated: aiGenerated || false,
    })
    .returning({ id: coverletters.id });

  return result[0].id;
}

export async function getCoverletter(userId: number) {
  return await db.select().from(coverletters).where(eq(coverletters.userId, userId));
}

export async function getCoverletterById(id: number, aiGenerated?: boolean) {
  if (aiGenerated !== undefined) {
    return await db
      .select()
      .from(coverletters)
      .where(and(eq(coverletters.id, id), eq(coverletters.aiGenerated, aiGenerated)));
  }
  return await db.select().from(coverletters).where(eq(coverletters.id, id));
}

// Function to save IP asset registration information
export async function saveIpAsset(
  userId: number,
  tokenId: number,
  licenseTermId: number,
  cid: string,
  ipId: string,
  txHash: string
): Promise<{ id: number }[]> {
  return await db
    .insert(ipAssets)
    .values({
      userId,
      tokenId,
      licenseTermId,
      cid,
      ipId,
      txHash,
    })
    .returning({ id: ipAssets.id });
}

// Function to retrieve IP asset registration information
export async function getIpAssets(userId: number) {
  return await db.select().from(ipAssets).where(eq(ipAssets.userId, userId));
}

// Function to retrieve IP asset registration information by ID
export async function getIpAssetById(id: number) {
  return await db.select().from(ipAssets).where(eq(ipAssets.id, id));
}

export async function getIpAssetByCid(cid: string) {
  return await db.select().from(ipAssets).where(eq(ipAssets.cid, cid));
}

export async function getCoverletterByCid(cid: string) {
  return await db.select().from(coverletters).where(eq(coverletters.cid, cid));
}

export async function getLatestCoverletterByCidAndUserId(userId: number) {
  const result = await db
    .select()
    .from(coverletters)
    .where(and(eq(coverletters.userId, userId)))
    .orderBy(desc(coverletters.created_at))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// 이력서 텍스트 저장 함수
export async function saveCoverletterText(coverletterId: number, text: string) {
  return await db.insert(coverletterTexts).values({
    coverletterId,
    text,
  });
}

// 이력서 텍스트 조회 함수
export async function getCoverletterTextByCoverletterId(coverletterId: number) {
  return await db
    .select()
    .from(coverletterTexts)
    .where(eq(coverletterTexts.coverletterId, coverletterId));
}

// Function to save IP asset reference information
export async function saveIpReference(ownerIpId: number, referenceIpId: number) {
  return await db.insert(ipReferences).values({
    owner_ip_id: ownerIpId,
    reference_ip_id: referenceIpId,
  });
}

// Function to retrieve IP asset reference information by ID
export async function getIpReferenceById(id: number) {
  return await db.select().from(ipReferences).where(eq(ipReferences.owner_ip_id, id));
}

// Function to retrieve IP asset registration information by IP ID
export async function getIpAssetByIpId(ipId: string) {
  return await db.select().from(ipAssets).where(eq(ipAssets.ipId, ipId));
}

// Function to save royalty information
export async function saveRoyalty(
  parentIpId: number,
  childIpId: number,
  amount: number,
  txHash: string,
  revenueReceipt?: string
) {
  return await db.insert(royalties).values({
    parentIpId,
    childIpId,
    amount,
    txHash,
    revenueReceipt,
  });
}

// Function to retrieve royalties by user ID
export async function getRoyaltiesByUserId(userId: number) {
  return await db
    .select()
    .from(royalties)
    .innerJoin(ipAssets, eq(royalties.parentIpId, ipAssets.id))
    .where(eq(ipAssets.userId, userId));
}

// Function to retrieve royalties by child IP ID
export async function getRoyaltiesByChildIpId(childIpId: number) {
  return await db.select().from(royalties).where(eq(royalties.childIpId, childIpId));
}

// 이력서 참조 정보 저장 함수
export async function saveCoverletterReference(
  coverletterId: number,
  referencedCoverletterId: number,
  contribution: number
) {
  return await db.insert(coverletterReferences).values({
    coverletterId,
    referencedCoverletterId,
    contribution,
  });
}

// 이력서 텍스트와 참조 정보를 함께 저장하는 함수
export async function saveCoverletterWithReferences(
  coverletterId: number,
  text: string,
  references: Array<{ id: number; contribution: number }>
) {
  // 이력서 텍스트 저장
  await saveCoverletterText(coverletterId, text);

  // 참조하는 이력서들 저장
  for (const ref of references) {
    await saveCoverletterReference(coverletterId, ref.id, ref.contribution);
  }
}

export const getResume = async (userId: number) => {
  return await db.select().from(coverletters).where(eq(coverletters.userId, userId));
};

export async function getUserIPs(userId: number) {
  return await db.select().from(ipAssets).where(eq(ipAssets.userId, userId));
}

export async function getRoyaltiesByIpIds(ipIds: number[]) {
  return await db.select().from(royalties).where(inArray(royalties.parentIpId, ipIds));
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
        job_category VARCHAR(255),
        job_subcategory VARCHAR(255),
        job_specific VARCHAR(255),
        metadata JSONB,
        ai_generated BOOLEAN DEFAULT FALSE,
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
      'job_category',
      'job_subcategory',
      'job_specific',
      'metadata',
      'ai_generated',
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

        console.log(`Added column ${column} to Coverletter table`);
      }
    }
  }

  const ipAssetsResult = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'ip_assets'
    );`;

  if (!ipAssetsResult[0].exists) {
    await client`
      CREATE TABLE ip_assets (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token_id BIGINT NOT NULL,
        license_term_id BIGINT NOT NULL,
        cid VARCHAR(255) NOT NULL,
        ip_id VARCHAR(255) NOT NULL,
        tx_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES "User" (id)
      );`;
  }

  const coverletterTextsResult = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'CoverletterText'
    );`;

  if (!coverletterTextsResult[0].exists) {
    await client`
      CREATE TABLE "CoverletterText" (
        id SERIAL PRIMARY KEY,
        coverletter_id BIGINT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT coverletter_id FOREIGN KEY (coverletter_id) REFERENCES "Coverletter" (id)
      );`;
  }

  const ipReferenceResult = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'IpReferences'
    );`;

  if (!ipReferenceResult[0].exists) {
    await client`
      CREATE TABLE "IpReferences" (
        id SERIAL PRIMARY KEY,
        owner_ip_id BIGINT NOT NULL,
        reference_ip_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`;
  }

  // Check if Royalty table exists
  const royaltyResult = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Royalty'
    );`;

  if (!royaltyResult[0].exists) {
    await client`
      CREATE TABLE "Royalty" (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        parent_ip_id BIGINT NOT NULL,
        child_ip_id BIGINT NOT NULL,
        amount DOUBLE PRECISION,
        tx_hash VARCHAR(255) NOT NULL,
        revenue_receipt VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES "User" (id)
      );`;
  }
}

// Verify table creation
ensureTablesExist();
