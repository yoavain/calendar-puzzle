/* eslint-disable no-console */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Decrypts a hybrid-encrypted payload.
 * Usage: node scripts/decrypt-payload.js '<json_payload>'
 * Or: echo '<json_payload>' | node scripts/decrypt-payload.js
 */

async function main() {
    let input = "";

    // Read from command line argument
    if (process.argv[2]) {
        input = process.argv[2];
    }
    else {
        // Read from stdin
        // For ESM and reading from stdin, we can use process.stdin
        input = await new Promise((resolve) => {
            let data = "";
            process.stdin.on("data", (chunk) => {
                data += chunk;
            });
            process.stdin.on("end", () => {
                resolve(data);
            });
            // Handle cases where stdin might be empty/closed immediately
            setTimeout(() => {
                if (data === "") {
                    resolve("");
                }
            }, 100);
        });
    }

    if (!input || input.trim() === "") {
        console.error("Error: No input provided. Provide the encrypted JSON as an argument or via stdin.");
        process.exit(1);
    }

    let data;
    try {
        data = JSON.parse(input);
    }
    catch (e) {
        console.error("Error: Input is not valid JSON.");
        process.exit(1);
    }

    const privateKeyPath = path.resolve(__dirname, "..", "private-key.pem");
    if (!fs.existsSync(privateKeyPath)) {
        console.error(`Error: Private key not found at ${privateKeyPath}`);
        process.exit(1);
    }

    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    try {
        // 1. Decrypt the AES key using RSA
        const aesKey = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256"
            },
            Buffer.from(data.encryptedKey, "base64")
        );

        // 2. Decrypt the payload using AES-GCM
        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            aesKey,
            Buffer.from(data.iv, "base64")
        );

        decipher.setAuthTag(Buffer.from(data.authTag, "base64"));

        let decrypted = decipher.update(data.payload, "base64", "utf8");
        decrypted += decipher.final("utf8");

        const result = JSON.parse(decrypted);
        console.log(JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error("Decryption failed:", error.message);
        process.exit(1);
    }
}

main();
