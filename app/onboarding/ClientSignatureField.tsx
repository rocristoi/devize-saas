"use client";

import React, { useState } from 'react';
import { SignaturePad } from '@/components/ui/SignaturePad';

export function ClientSignatureField() {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  return (
    <div>
      <div className="w-full bg-white dark:bg-gray-700/50 rounded-xl overflow-hidden mb-2">
        <SignaturePad
          onChange={(url) => setSignatureDataUrl(url)}
          hideSaveButton={true}
        />
      </div>
      {signatureDataUrl && (
        <input type="hidden" name="signatureDataUrl" value={signatureDataUrl} />
      )}
    </div>
  );
}
