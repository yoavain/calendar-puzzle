import { EncryptedPayload } from '../../common/types';

/**
 * Utility for hybrid encryption (RSA + AES-GCM) using the Web Crypto API.
 */

/**
 * Converts a PEM-formatted public key string to an ArrayBuffer.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');
    const binaryStr = window.atob(b64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Encrypts a payload using a hybrid RSA + AES-GCM scheme.
 * 
 * 1. Generates a random AES-256 key and IV.
 * 2. Encrypts the payload with AES-GCM.
 * 3. Encrypts the AES key with the server's RSA public key.
 */
export async function encryptPayload(payload: unknown, publicKeyPem: string): Promise<EncryptedPayload> {
    const encoder = new TextEncoder();
    const encodedPayload = encoder.encode(JSON.stringify(payload));

    // 1. Import the RSA public key
    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        pemToArrayBuffer(publicKeyPem),
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        false,
        ['encrypt']
    );

    // 2. Generate a random AES-256 key
    const aesKey = await window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt']
    );

    // 3. Export the AES key to encrypt it with RSA
    const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

    // 4. Encrypt the AES key with RSA
    const encryptedKey = await window.crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP',
        },
        publicKey,
        exportedAesKey
    );

    // 5. Generate a random IV (12 bytes for GCM)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // 6. Encrypt the payload with AES-GCM
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        aesKey,
        encodedPayload
    );

    // The result of AES-GCM encryption includes the Auth Tag at the end
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const authTagLength = 16;
    const tag = encryptedArray.slice(-authTagLength);
    const ciphertext = encryptedArray.slice(0, -authTagLength);

    // Helper to convert ArrayBuffer to Base64
    const toBase64 = (buf: ArrayBuffer | Uint8Array) => {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    return {
        encryptedKey: toBase64(encryptedKey),
        iv: toBase64(iv),
        authTag: toBase64(tag),
        payload: toBase64(ciphertext),
    };
}
