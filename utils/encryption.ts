import CryptoJS from 'crypto-js';

// Encryption key (from environment variable or default value)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'rocketpunch';

/**
 * Function to encrypt CID
 * @param cid CID to encrypt
 * @returns Encrypted CID string
 */
export function encryptCID(cid: string): string {
  try {
    return CryptoJS.AES.encrypt(cid, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Error during CID encryption:', error);
    throw new Error('Failed to encrypt CID');
  }
}

/**
 * Function to decrypt encrypted CID
 * @param encryptedCID Encrypted CID
 * @returns Decrypted CID string
 */
export function decryptCID(encryptedCID: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedCID, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Decrypted CID is empty');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Error during CID decryption:', error);
    throw new Error('Failed to decrypt CID');
  }
} 