import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let db: any = null;

try {
  const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  console.error("Firebase init failed in api route:", error);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  let versionText = 'v0.1 ok';

  if (db) {
    try {
      const docRef = doc(db, 'settings', 'versionsandroid');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.value === 'string') {
          versionText = data.value;
        }
      }
    } catch (error) {
      console.error("Error fetching versionsandroid settings:", error);
    }
  }

  return res.status(200).send(versionText);
}
