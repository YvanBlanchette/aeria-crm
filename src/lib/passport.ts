import crypto from "crypto";

const PREFIX = "enc:v1";

function key() {
	const secret = process.env.PASSPORT_SECRET ?? process.env.AUTH_SECRET;
	if (!secret) throw new Error("PASSPORT_SECRET ou AUTH_SECRET manquant dans .env");
	return crypto.createHash("sha256").update(secret).digest();
}

function isEncryptedPassportValue(value: string) {
	return value.startsWith(`${PREFIX}:`);
}

export function encryptPassportNumber(value: string | null | undefined) {
	if (!value) return null;
	if (isEncryptedPassportValue(value)) return value;

	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
	const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();

	return `${PREFIX}:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptPassportNumber(value: string | null | undefined) {
	if (!value) return null;
	if (!isEncryptedPassportValue(value)) return value;

	const parts = value.split(":");
	if (parts.length !== 5) return value;

	const iv = Buffer.from(parts[2], "base64url");
	const tag = Buffer.from(parts[3], "base64url");
	const encrypted = Buffer.from(parts[4], "base64url");

	try {
		const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
		decipher.setAuthTag(tag);
		const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
		return decrypted.toString("utf8");
	} catch {
		return value;
	}
}
