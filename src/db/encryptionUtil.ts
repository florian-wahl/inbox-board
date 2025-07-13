const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

export class EncryptionUtil {
    private static async generateKey(password: string): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('inbox-board-salt'),
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: ALGORITHM, length: KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    }

    static async encrypt(text: string, password: string): Promise<string> {
        try {
            const key = await this.generateKey(password);
            const encoder = new TextEncoder();
            const data = encoder.encode(text);

            const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

            const encrypted = await crypto.subtle.encrypt(
                { name: ALGORITHM, iv },
                key,
                data
            );

            const encryptedArray = new Uint8Array(encrypted);
            const result = new Uint8Array(iv.length + encryptedArray.length);
            result.set(iv);
            result.set(encryptedArray, iv.length);

            return btoa(String.fromCharCode(...Array.from(result)));
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    static async decrypt(encryptedText: string, password: string): Promise<string> {
        try {
            const key = await this.generateKey(password);
            const decoder = new TextDecoder();

            const encryptedData = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

            const iv = encryptedData.slice(0, IV_LENGTH);
            const data = encryptedData.slice(IV_LENGTH);

            const decrypted = await crypto.subtle.decrypt(
                { name: ALGORITHM, iv },
                key,
                data
            );

            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    static async encryptRefreshToken(token: string): Promise<string> {
        const deviceId = await this.getDeviceId();
        return this.encrypt(token, deviceId);
    }

    static async decryptRefreshToken(encryptedToken: string): Promise<string> {
        const deviceId = await this.getDeviceId();
        return this.decrypt(encryptedToken, deviceId);
    }

    private static async getDeviceId(): Promise<string> {
        // Generate a device-specific ID based on available hardware info
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx?.fillText('device-id', 0, 0);

        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL(),
        ].join('|');

        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hash = await crypto.subtle.digest('SHA-256', data);

        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
} 