import {
  scrypt as scryptCallback,
  timingSafeEqual,
  randomBytes,
  BinaryLike,
  createHash,
} from 'node:crypto';
import { promisify } from 'node:util';

/**
 * [description]
 */
const scrypt = promisify<BinaryLike, BinaryLike, number, Buffer>(scryptCallback);

/**
 * [description]
 */
const saltRounds = 16;
const keyLength = 64;

/**
 * [description]
 * @param password
 */
export const hash = async (password: string): Promise<string> => {
  const salt = randomBytes(saltRounds).toString('hex');
  const derivedKey = await scrypt(password, salt, keyLength);
  return salt + ':' + derivedKey.toString('hex');
};

/**
 * [description]
 * @param password
 */
export const sha256 = async (password: string): Promise<string> => {
  return createHash('sha256').update(password).digest('hex');
};

/**
 * [description]
 * @param password
 * @param encrypted
 */
export const compare = async (password: string, encrypted: string): Promise<boolean> => {
  const [salt, key] = encrypted.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = await scrypt(password, salt, keyLength);
  return timingSafeEqual(keyBuffer, derivedKey);
};

/**
 * [description]
 * @param digits
 * @param size
 */
export const generateCode = (digits = 6, size = 20): string => {
  const buffer = randomBytes(size);
  const value = buffer.readUInt32BE(0x0f) % 10 ** digits;
  return value.toString().padStart(digits, '0');
};

/**
 * [description]
 * @param digits
 * @param size
 */
export const generateRandomToken = (size = 20): string => {
  return randomBytes(size).toString('hex');
};
