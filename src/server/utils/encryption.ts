import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const privateKeyPath = path.resolve(process.cwd(), 'private-key.pem');

let privateKey: string | null = null;

function getPrivateKey(): string {
    if (privateKey) return privateKey;
    if (!fs.existsSync(privateKeyPath)) {
        throw new Error(`Private key not found at ${privateKeyPath}`);
    }
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    return privateKey;
}

export interface EncryptedPayload {
    encryptedKey: string; // Base64
    iv: string;           // Base64
    authTag: string;      // Base64
    payload: string;      // Base64
}

/**
 * Decrypts a hybrid-encrypted payload.
 * 1. Decrypt AES key using RSA private key.
 * 2. Decrypt payload using AES-GCM.
 */
export function decryptPayload(data: EncryptedPayload): any {
    const key = getPrivateKey();

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
