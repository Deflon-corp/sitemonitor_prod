import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'SiteMonitorSecretKey2026Secure32';

export const decrypt = (encryptedText) => {
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) return null;
    
    const iv = CryptoJS.enc.Hex.parse(textParts[0]);
    const encryptedData = CryptoJS.enc.Hex.parse(textParts[1]);

    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: encryptedData
    });

    const decrypted = CryptoJS.AES.decrypt(
      cipherParams,
      CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY),
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
