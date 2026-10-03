import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(req: Request) {
  const { claimIds } = await req.json();
  const db = getDb();
  
  const token = 'frl_tk_' + Math.random().toString(36).substring(2, 15);
  
  const newLink = {
    id: `link_${Date.now()}`,
    claim_ids: claimIds,
    token,
    created_by: 'c1',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };
  
  db.links.push(newLink);
  saveDb(db);
  
  return NextResponse.json({ token });
}
