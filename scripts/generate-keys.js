/* eslint-disable no-console */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "..");
const privateKeyPath = path.join(rootDir, "private-key.pem");
const publicKeyPath = path.join(rootDir, "public-key.pem");

console.log("Generating RSA 2048-bit key pair...");

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: "spki",
        format: "pem"
    },
    privateKeyEncoding: {
        type: "pkcs8",
        format: "pem"
    }
});

fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);

console.log(`Keys generated successfully:
- Private key: ${privateKeyPath}
- Public key: ${publicKeyPath}

IMPORTANT: Keep the private key secret and never commit it to version control.`);
