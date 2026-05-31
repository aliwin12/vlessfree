import React, { useEffect, useState } from 'react';
import { db, doc, getDoc } from '../lib/firebase';

export default function VersionsAndroidPage() {
  const [text, setText] = useState('v0.1 ok');

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const docRef = doc(db, 'settings', 'versionsandroid');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && typeof data.value === 'string') {
            setText(data.value);
          }
        }
      } catch (error) {
        console.error("Error loading versionsandroid:", error);
      }
    };
    
    fetchVersion();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-mono select-all selection:bg-white selection:text-black">
      {text}
    </div>
  );
}
