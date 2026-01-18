import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EncryptedPayload } from '../../common/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const privateKeyPath = path.resolve(process.cwd(), 'private-key.pem');

let privateKey: string | null = null;

async function getPrivateKey(): Promise<string> {
    if (privateKey) return privateKey;
    try {
        await fs.access(privateKeyPath);
    } catch {
        throw new Error(`Private key not found at ${privateKeyPath}`);
    }
    privateKey = await fs.readFile(privateKeyPath, 'utf8');
    return privateKey;
}

/**
 * Decrypts a hybrid-encrypted payload.
 * 1. Decrypt AES key using RSA private key.
 * 2. Decrypt payload using AES-GCM.
 */
export async function decryptPayload(data: EncryptedPayload): Promise<unknown> {
    const key = await getPrivateKey();

    // 1. Decrypt the AES key using RSA
    const aesKey = crypto.privateDecrypt(
        {
            key,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        },
        Buffer.from(data.encryptedKey, 'base64')
    );

    // 2. Decrypt the payload using AES-GCM
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        aesKey,
        Buffer.from(data.iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(data.authTag, 'base64'));

    let decrypted = decipher.update(data.payload, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
}
