/**
 * lib/netopia.ts
 *
 * Implements the official Netopia Node.js SDK pattern:
 * https://github.com/mobilpay/Node.js
 * https://doc.netopia-payments.com/docs/payment-sdks/nodejs/
 *
 * Encryption: AES-256-CBC (NOT RC4)
 *   - Random 32-byte symmetric key + 16-byte IV
 *   - Symmetric key is RSA-PKCS1 encrypted with Netopia's public certificate
 *   - `ipn_cipher: "aes-256-cbc"` tells Netopia which cipher to use on
 *     the IPN callback back to us
 *
 * Form POST fields to Netopia: env_key · data · iv · cipher
 * IPN POST fields from Netopia: env_key · data · iv · cipher
 */

import crypto from 'crypto';
import * as forge from 'node-forge';
import { Builder } from 'xml2js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NetopiaOrder {
  orderId: string;
  amount: number;
  currency: string;
  details: string;
  confirmUrl: string;
  returnUrl: string;
  billing: {
    firstName: string;
    lastName: string;
    address?: string;
    email: string;
    phone: string;
  };
}

/** The encrypted envelope returned by encryptNetopiaPayload(). */
export interface NetopiaEnvelope {
  /** Base64 RSA-PKCS1-encrypted AES key */
  env_key: string;
  /** Base64 AES-256-CBC-encrypted XML */
  data: string;
  /** Base64 AES IV */
  iv: string;
  /** Always "aes-256-cbc" */
  cipher: string;
  /** Netopia gateway URL */
  url: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CIPHER = 'aes-256-cbc' as const;
const PUBLIC_CERT_PEM = process.env.NETOPIA_PUBLIC_KEY ?? '';
const PRIVATE_KEY_PEM  = process.env.NETOPIA_PRIVATE_KEY ?? '';
const SIGNATURE = process.env.NETOPIA_SIGNATURE ?? 'XXXX-XXXX-XXXX-XXXX-XXXX';
const IS_SANDBOX = process.env.NODE_ENV !== 'production';

const NETOPIA_URL = IS_SANDBOX
  ? 'https://sandboxsecure.mobilpay.ro'
  : 'https://secure.mobilpay.ro';

// ─── Encrypt ──────────────────────────────────────────────────────────────────

/**
 * Encrypts a payment order and returns the envelope to POST to Netopia.
 * Matches the official mobilpay/Node.js encrypt.js implementation exactly.
 */
export function encryptNetopiaPayload(order: NetopiaOrder): NetopiaEnvelope {
  if (!PUBLIC_CERT_PEM) {
    console.warn('[NETOPIA] PUBLIC_KEY not configured — returning mock envelope');
    return {
      env_key: 'MOCK_ENV_KEY',
      data: Buffer.from('<mock/>').toString('base64'),
      iv: Buffer.alloc(16).toString('base64'),
      cipher: CIPHER,
      url: NETOPIA_URL,
    };
  }

  // 1. Build the XML object (mirrors official order.js structure exactly)
  const xmlObj = {
    order: {
      $: {
        id: order.orderId,
        timestamp: Date.now(),  // official SDK uses ms here
        type: 'card',
      },
      signature: SIGNATURE,
      url: {
        return: order.returnUrl,
        confirm: order.confirmUrl,
      },
      invoice: {
        $: {
          currency: order.currency,
          amount: order.amount.toFixed(2),
        },
        details: order.details,
        contact_info: {
          billing: {
            $: { type: 'person' },
            first_name: order.billing.firstName,
            last_name: order.billing.lastName,
            address: order.billing.address ?? '',
            email: order.billing.email,
            mobile_phone: order.billing.phone,
          },
        },
      },
      ipn_cipher: CIPHER,
    },
  };

  const builder = new Builder({ cdata: true });
  const xml = builder.buildObject(xmlObj);

  // 2. AES-256-CBC encrypt the XML
  const aesKey = crypto.randomBytes(32);
  const iv     = crypto.randomBytes(16);
  const c      = crypto.createCipheriv(CIPHER, aesKey, iv);
  let encrypted = c.update(xml, 'utf8', 'base64');
  encrypted    += c.final('base64');

  // 3. RSA-PKCS1 encrypt the AES key using node-forge
  //    node-forge handles "-----BEGIN CERTIFICATE-----" the same way
  //    PHP's openssl_public_encrypt does — no manual key extraction needed.
  const forgeCert      = forge.pki.certificateFromPem(PUBLIC_CERT_PEM);
  const forgePubKey    = forgeCert.publicKey as forge.pki.rsa.PublicKey;
  const encryptedKeyBin = forgePubKey.encrypt(
    aesKey.toString('binary'),
    'RSAES-PKCS1-V1_5',
  );

  return {
    env_key: Buffer.from(encryptedKeyBin, 'binary').toString('base64'),
    data:    encrypted,
    iv:      iv.toString('base64'),
    cipher:  CIPHER,
    url:     NETOPIA_URL,
  };
}

// ─── Decrypt ──────────────────────────────────────────────────────────────────

/**
 * Decrypts an IPN payload from Netopia.
 * Matches the official mobilpay/Node.js encrypt.js decrypt() implementation.
 */
export function decryptNetopiaIpn(
  env_key: string,
  data:    string,
  iv:      string,
  cipher:  string,
): string {
  if (!PRIVATE_KEY_PEM) {
    throw new Error('[NETOPIA] NETOPIA_PRIVATE_KEY is not configured');
  }

  // 1. RSA-decrypt the AES key (node-forge, matches official SDK)
  const forgePrivKey    = forge.pki.privateKeyFromPem(PRIVATE_KEY_PEM);
  const encKeyBin       = Buffer.from(env_key, 'base64').toString('binary');
  const aesKeyBin       = forgePrivKey.decrypt(encKeyBin, 'RSAES-PKCS1-V1_5');
  const aesKey          = Buffer.from(aesKeyBin, 'binary');

  // 2. AES-CBC decrypt the XML
  const decipher = crypto.createDecipheriv(
    cipher as Parameters<typeof crypto.createDecipheriv>[0],
    aesKey,
    Buffer.from(iv, 'base64'),
  );
  let xml  = decipher.update(data, 'base64', 'utf8');
  xml     += decipher.final('utf8');

  return xml;
}
