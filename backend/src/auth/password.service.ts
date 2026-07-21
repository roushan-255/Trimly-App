import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await this.deriveKey(password, salt);

    return [
      HASH_PREFIX,
      salt.toString("base64url"),
      hash.toString("base64url"),
    ].join("$");
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, saltValue, hashValue, extra] = storedHash.split("$");

    if (
      algorithm !== HASH_PREFIX ||
      !saltValue ||
      !hashValue ||
      extra !== undefined
    ) {
      return false;
    }

    try {
      const salt = Buffer.from(saltValue, "base64url");
      const expectedHash = Buffer.from(hashValue, "base64url");
      const actualHash = await this.deriveKey(password, salt);

      return (
        expectedHash.length === actualHash.length &&
        timingSafeEqual(expectedHash, actualHash)
      );
    } catch {
      return false;
    }
  }

  private deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      });
    });
  }
}
