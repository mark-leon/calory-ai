import { FunctionsHttpError } from '@supabase/supabase-js';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ScanItem } from '../state/types';
import { supabase } from './supabase';

export type ScanOutcome =
  | { status: 'ok'; items: ScanItem[]; scansUsedToday: number }
  | { status: 'no_food'; scansUsedToday: number }
  | { status: 'quota_exceeded'; scansUsedToday: number }
  | { status: 'error' };

const MAX_EDGE_PX = 1024; // plenty for dish recognition; keeps upload ~150 KB and image tokens low
const TIMEOUT_MS = 35_000;

async function toJpegBase64(uri: string): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: MAX_EDGE_PX });
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!saved.base64) throw new Error('image encode failed');
  return saved.base64;
}

export async function analyzeMeal(photoUri: string): Promise<ScanOutcome> {
  try {
    const image_base64 = await toJpegBase64(photoUri);
    const call = supabase.functions.invoke('analyze-meal', { body: { image_base64, mime_type: 'image/jpeg' } });
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('scan timed out')), TIMEOUT_MS));
    const { data, error } = await Promise.race([call, timeout]);

    if (error) {
      if (error instanceof FunctionsHttpError) {
        const body = await error.context.json().catch(() => ({}));
        if (body.code === 'quota_exceeded') return { status: 'quota_exceeded', scansUsedToday: body.scans_used_today };
      }
      console.warn('analyze-meal failed', error);
      return { status: 'error' };
    }
    if (data.status === 'ok') return { status: 'ok', items: data.items, scansUsedToday: data.scans_used_today };
    if (data.status === 'no_food') return { status: 'no_food', scansUsedToday: data.scans_used_today };
    return { status: 'error' };
  } catch (e) {
    console.warn('analyze-meal failed', e);
    return { status: 'error' };
  }
}
