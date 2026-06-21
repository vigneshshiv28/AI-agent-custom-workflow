import crypto from "node:crypto";

const KEY = Buffer.from(process.env.ENCRYPTION_KEY ?? "", "base64");

if (KEY.length !== 32) {
    throw new Error(
        "ENCRYPTION_KEY env var must be a base64-encoded 32-byte key"
    );
}

const ALGO = "aes-256-gcm";

export function encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);

    const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [iv, authTag, ciphertext].map((b) => b.toString("base64")).join(":");
}


export function decrypt(payload: string): string {
    const [ivB64, authTagB64, ciphertextB64] = payload.split(":");
    if (!ivB64 || !authTagB64 || !ciphertextB64) {
        throw new Error("Malformed encrypted payload");
    }

    const decipher = crypto.createDecipheriv(
        ALGO,
        KEY,
        Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

    return Buffer.concat([
        decipher.update(Buffer.from(ciphertextB64, "base64")),
        decipher.final(),
    ]).toString("utf8");
}