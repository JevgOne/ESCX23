'use client';

import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';

interface PhotoUploadProps {
  girlId: string;
}

async function compressImage(file: File): Promise<{ blob: Blob; filename: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Max 2000px on longest side
      const maxDim = 2000;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round(h * (maxDim / w));
          w = maxDim;
        } else {
          w = Math.round(w * (maxDim / h));
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas conversion failed'));
          resolve({ blob, filename: file.name.replace(/\.[^.]+$/, '.webp') });
        },
        'image/webp',
        0.82,
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function PhotoUpload({ girlId }: PhotoUploadProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(`Komprimace 0/${files.length}...`);

    try {
      const compressed: { blob: Blob; filename: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Komprimace ${i + 1}/${files.length}...`);
        compressed.push(await compressImage(files[i]));
      }

      // Get current min display_order via API
      const orderRes = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getMinOrder', girlId: Number(girlId) }),
      });
      const orderData = await orderRes.json();
      let nextOrder = (orderData.minOrder ?? 100) - compressed.length;

      for (let i = 0; i < compressed.length; i++) {
        setProgress(`Nahrávání ${i + 1}/${compressed.length}...`);
        const { blob: imageBlob, filename } = compressed[i];
        const blobFilename = `girls/${girlId}/${Date.now()}-${crypto.randomUUID()}.webp`;

        // Upload directly to Vercel Blob (bypasses serverless size limit)
        const blobResult = await upload(blobFilename, imageBlob, {
          access: 'public',
          contentType: 'image/webp',
          handleUploadUrl: '/api/admin/photos/client-upload',
        });

        // Save to DB via API
        await fetch('/api/admin/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveUploaded',
            girlId: Number(girlId),
            filename: blobFilename,
            url: blobResult.url,
            displayOrder: nextOrder,
          }),
        });
        nextOrder++;
      }

      setProgress('Hotovo!');
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch (e) {
      setProgress('');
      alert('Upload selhal: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-form" style={{ marginBottom: '32px' }}>
      <div style={{ fontSize: '12px', color: 'var(--color-coral)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        Nahrát fotky
      </div>
      <div className="upload-dropzone">
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.avif"
          multiple
          disabled={uploading}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="admin-btn-primary"
          style={{ marginTop: '12px' }}
        >
          {uploading ? progress : 'Nahrát'}
        </button>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginTop: '8px' }}>
        Max 10 MB · JPG, PNG, WebP, AVIF · Komprimuje se automaticky
      </p>
    </div>
  );
}
