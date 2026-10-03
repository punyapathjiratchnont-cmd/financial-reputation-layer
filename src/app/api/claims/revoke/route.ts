import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { Claim } from '@/lib/types';

export async function POST(req: Request) {
  const { claimId } = await req.json();
  const db = getDb();
  
  const claimIndex = db.claims.findIndex((c: Claim) => c.id === claimId);
  if (claimIndex !== -1) {
    db.claims[claimIndex].status = 'revoked';
    db.claims[claimIndex].revoked_at = new Date().toISOString();
    saveDb(db);
  }
  
  return NextResponse.json({ success: true });
}
