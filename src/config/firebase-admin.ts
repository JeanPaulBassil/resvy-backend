import * as admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

// TEMPORARY: Hardcoded service account credentials
// TODO: Remove this hardcoded credential and revert to the environment variable approach
const serviceAccountCredentials: ServiceAccount = {
  projectId: "resvy-5f670",
  // private_key_id: "93f38f307f0845c47d5173ccc7267180a7f3cdc7",
  privateKey:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCU0svpdF3TJUVq\ndoAfB3fvaclJLl1/kJjQZrQjQMytgzHlcFIWwCryy73ZftkeXZ0RV3fD6g6H4B1l\nkyOgwkcMZnJxswuJi7Mp1J8uHXjpq5RJXiM5PO338l7k5qkV3mrr1YGGfwb4cT2v\neEzHpC0kn5LZZT2EDJHHuoaVaajdCzlc6m66WpTBXOuStheiLi6iiqr0sz+HUmEU\nEZ03HkidG42Y35/DpCWXnZBcCg9sQZaM13uAJbXMU0ohxsocam0V6S1Qi/3+m5Te\nZNbY7/AKT/orHPHuND91/DGhDzhQ3Ne6ozsSwqKZGlbULyY2HEcJzDArHivaHrU/\ntDiDW3k5AgMBAAECggEAI9OvVS83WxpQ4LVQWKfynocn9t8bkRcdQqZG3Wm/HFJG\nE8b7bBCtBjA4LwDTgfTlWARnh5l0EA/K4+YNIKlEc17CVE7XCzC/W+WcwHxF3HL6\nysLH1gKuAw+s+ovwzpvxv35xpRA1fF++itx6F2GVoIht0LoHmh9whNWJirSZ+0RX\nevMLmPeZ/9iVFZHJxPEHBLHmU7K4FqhGJ4opxK7uBHypb5gFwaTnn6jQR+4e5LXp\nC68pEwp15rQqemhcpetOBpR7qS1QFflh7Wmf16lAycxo0ua4BUhfw+pBj5nRg9yT\nrBASlO0WnJ30QUgf40GtvG+EyfIpNHA9/klRj41UpQKBgQDEOqa4Bzkq7oi9QIBT\nK0yVx9fZxpUMqJ+NaZHJMQu7z2XIeGWoIrujllRj7dtk3a6DdvIWd7qfj/8H7Jfy\n18h+XwAFQm92Zo5L3NRbgMD7JUXI1vsojnllFOJvxEBAaA6LzF00YxU6n+vkN3lR\nD/Z2Ou5ms+Mpo87BgCr3pXUhwwKBgQDCJ5gpc2xlHFcP7VWIYiGcIvBMMndAVN4j\nMYMRhfjN0KLNi0knQfl53ddALolsBioYZedk9vdtg3KAT+j4XWkgKE6dXAekcHwk\n0zrR37gLSTNdVDRNSuOcw4+As1xYUGywCSXvwjqts7EedaGtTsCpdTJOLAHCpQQe\nzccT12DtUwKBgFUadsnjYBjNgQJLIhxv7/QZyvSJGoV18FS9T1vpaIRYi3UpOjV0\nctqczRbVxsv1FMWxZYb3ADpJkjrWkoPgr/SWsQSW7o50Jgyixnq02X1SifRzwFOz\njtSW/Smp/I+yUXSx+k5JFqDpUL4WjQfqG2LlZhWmuMOLZpUnR/tFiApPAoGAOXI7\nrHARb21OOVEw0JSweyE/VlxMOoWh4Gni7Qllz4fe09BVib8UkMFZ0gyy7np4dBWa\nvJ3yIb4V3+9E8E+7Lh+e+yJixH3fzYmOStDWBMjY4NFsVD5HUHfwetUXCq5pKkDa\nr7EZaZHUYz3M45l8mecqRkTxFGV87ZxXPgCpFi8CgYEAm4OOQAJNIJ9505TLI5w7\nSFY8mNpXhPzWxcKk9NzQBVkuk0aLii55a1X6lxkM9zGazdqe+A4VbaO62fdNe1Yl\nIHJqu51YXPD7JhtZd9U8vT/kYuHqtXo+/UiXPYPIfAofZMu58NTY+QqPEFmPoxT9\nPhsYx2CZo3FrIRcCMMTFAAY=\n-----END PRIVATE KEY-----\n",
  clientEmail: "firebase-adminsdk-fbsvc@resvy-5f670.iam.gserviceaccount.com",
  // client_id: "102695002819804438002",
  // auth_uri: "https://accounts.google.com/o/oauth2/auth",
  // token_uri: "https://oauth2.googleapis.com/token",
  // auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  // client_x509_cert_url:
  //   "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40resvy-5f670.iam.gserviceaccount.com",
  // universe_domain: "googleapis.com",
};

if (!admin.apps.length) {
  try {
    // Initialize Firebase Admin with hardcoded credentials
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountCredentials),
    });
    console.log("Firebase Admin initialized with hardcoded credentials");

    /* Original code commented out
    console.log(
      "FIREBASE_SERVICE_ACCOUNT:",
      process.env.FIREBASE_SERVICE_ACCOUNT,
    );

    // Option 1: Use environment variable if available
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log("RAW ENV:", process.env.FIREBASE_SERVICE_ACCOUNT);
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin initialized with environment variable");
    }
    // Option 2: Fall back to file import
    else {
      console.log("Firebase Admin initialized with service account file");
      // Using require instead of import for dynamic loading
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require("./firebase-service-account.json");
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin initialized with service account file");
    }
    */
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    // Initialize with a minimal configuration to prevent app crashes
    admin.initializeApp();
    console.warn(
      "Firebase Admin initialized without credentials - token operations will fail",
    );
  }
}

export { admin };
