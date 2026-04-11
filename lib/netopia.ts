import crypto from "crypto";

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
    email: string;
    phone: string;
  };
}

// În producție, aceste fișiere se pun securizate și se citesc via fs.readFileSync
// sau se pun ca variabile de mediu sigure.
const PUBLIC_KEY = process.env.NETOPIA_PUBLIC_KEY || ""; 
const SIGNATURE = process.env.NETOPIA_SIGNATURE || "XXXX-XXXX-XXXX-XXXX-XXXX";

export function generateNetopiaPayload(order: NetopiaOrder) {
  // 1. Construim XML-ul conform documentației Netopia (MobilPay)
  const xmlData = `<?xml version="1.0" encoding="utf-8"?>
<order type="card" id="${order.orderId}" timestamp="${Date.now()}">
  <signature>${SIGNATURE}</signature>
  <url>
    <return>${order.returnUrl}</return>
    <confirm>${order.confirmUrl}</confirm>
  </url>
  <invoice currency="${order.currency}" amount="${order.amount.toFixed(2)}">
    <details>${order.details}</details>
    <contact_info>
      <billing type="person">
        <first_name>${order.billing.firstName}</first_name>
        <last_name>${order.billing.lastName}</last_name>
        <email>${order.billing.email}</email>
        <mobile_phone>${order.billing.phone}</mobile_phone>
      </billing>
    </contact_info>
  </invoice>
</order>`;

  if (!PUBLIC_KEY) {
    console.warn("[NETOPIA] PUBLIC_KEY nu e configurat. Va fi returnat un mock.");
    // Intoarcem date mockuite daca nu avem cheile configurate pt Dev
    return {
      envKey: "MOCK_ENV_KEY",
      data: Buffer.from(xmlData).toString('base64'),
      url: "https://sandboxsecure.mobilpay.ro"
    };
  }

  try {
    // 2. Criptare RC4 a XML-ului (Netopia cere generarea unei chei RC4 aleatorii de 16-32 bytes)
    const rc4Key = crypto.randomBytes(32);
    // RC4 Cipher (deprecated în Node.js, dar încă folosit de Netopia în varianta legacy. Recomandat API v2 REST, dar XML e cel clasic)
    const cipher = crypto.createCipheriv("rc4", rc4Key, "");
    let encryptedData = cipher.update(xmlData, "utf8", "base64");
    encryptedData += cipher.final("base64");

    // 3. Criptare cheie RC4 cu cheia publică RSA de la Netopia
    const encryptedKey = crypto.publicEncrypt({
      key: PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, rc4Key).toString('base64');

    return {
      envKey: encryptedKey,
      data: encryptedData,
      url: "https://secure.mobilpay.ro" // sau sandboxsecure.mobilpay.ro pentru teste
    };
  } catch (error) {
    console.error("Netopia Encryption Error:", error);
    throw new Error("Eroare la criptarea datelor Netopia.");
  }
}
