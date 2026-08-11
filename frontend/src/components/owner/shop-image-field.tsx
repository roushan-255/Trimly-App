'use client';

import { ImageIcon, LoaderCircle, Star, UploadCloud, X } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { AuthApiError, uploadShopImage } from '@/lib/auth';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImages = 10;

export function ShopImageField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  async function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    if (value.length + files.length > maxImages) {
      setError(`You can add up to ${maxImages} shop images.`);
      return;
    }
    if (files.some((file) => !allowedTypes.includes(file.type))) {
      setError('Choose only JPG, PNG, or WebP images.');
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setError('Each image must be smaller than 5 MB.');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const uploaded = await Promise.all(files.map(uploadShopImage));
      onChange([...value, ...uploaded]);
    } catch (caught: unknown) {
      setError(
        caught instanceof AuthApiError
          ? caught.message
          : 'Unable to upload these images.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  function addUrl() {
    const nextUrl = url.trim();
    if (!nextUrl) return;
    if (value.length >= maxImages) {
      setError(`You can add up to ${maxImages} shop images.`);
      return;
    }
    try {
      new URL(nextUrl);
    } catch {
      setError('Enter a valid public image URL.');
      return;
    }
    if (value.includes(nextUrl)) {
      setError('This image is already in the gallery.');
      return;
    }
    onChange([...value, nextUrl]);
    setUrl('');
    setError('');
  }

  function makeCover(index: number) {
    onChange([value[index], ...value.filter((_, current) => current !== index)]);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">Shop gallery <span className="font-medium text-slate-400">(up to {maxImages})</span></span>
        <span className="text-xs font-semibold text-slate-400">{value.length}/{maxImages} images</span>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {value.map((image, index) => (
            <div key={`${image}-${index}`} className={`group relative overflow-hidden rounded-2xl border bg-slate-100 ${index === 0 ? 'col-span-2 border-emerald-300' : 'border-slate-200'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`Shop preview ${index + 1}`} className={`w-full object-cover ${index === 0 ? 'h-48' : 'h-32'}`} />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/75 to-transparent p-3 pt-8">
                {index === 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white"><Star className="size-3.5 fill-amber-400 text-amber-400" /> Cover image</span>
                ) : (
                  <button type="button" onClick={() => makeCover(index)} className="rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-extrabold text-slate-800 transition hover:bg-white">Make cover</button>
                )}
                <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index))} className="grid size-8 place-items-center rounded-lg bg-slate-950/55 text-white transition hover:bg-rose-600" aria-label={`Remove shop image ${index + 1}`}><X className="size-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length < maxImages && (
        <label className={`grid min-h-32 cursor-pointer place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50 ${isUploading ? 'cursor-wait opacity-70' : ''}`}>
          <span>
            {isUploading ? <LoaderCircle className="mx-auto size-7 animate-spin text-emerald-600" /> : <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><ImageIcon className="size-5" /></span>}
            <strong className="mt-3 block text-sm text-slate-800">{isUploading ? 'Uploading images…' : value.length ? 'Add more images' : 'Choose shop images'}</strong>
            <span className="mt-1 block text-xs text-slate-500">Select one or more · JPG, PNG, or WebP · 5 MB each</span>
          </span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={isUploading} onChange={selectImages} className="sr-only" />
        </label>
      )}

      {value.length < maxImages && (
        <div className="grid gap-2 text-xs font-bold text-slate-500">
          Or add a public image URL
          <div className="flex gap-2">
            <input type="url" value={url} onChange={(event) => { setUrl(event.target.value); setError(''); }} placeholder="https://example.com/your-shop.jpg" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-950 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
            <button type="button" onClick={addUrl} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><UploadCloud className="size-4" /> Add</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
    </div>
  );
}
