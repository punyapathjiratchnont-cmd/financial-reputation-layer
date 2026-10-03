import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { PublicReview } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company_id = searchParams.get('company_id');

  const db = getDb();
  let reviews: PublicReview[] = db.reviews || [];

  if (company_id) {
    reviews = reviews.filter((r) => r.company_id === company_id);
  }

  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_id, author_name, review_text } = body;

    if (!company_id || !review_text) {
      return NextResponse.json({ error: 'company_id and review_text are required' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date();
    const created_at = now.toISOString().split('T')[0];

    // P5 Decay: Expiration date is 1 year from creation
    const expiresDate = new Date(now);
    expiresDate.setFullYear(expiresDate.getFullYear() + 1);
    const expires_at = expiresDate.toISOString().split('T')[0];

    const newReview: PublicReview = {
      id: `rev_${Date.now()}`,
      company_id,
      author_name: author_name?.trim() || 'Anonymous Public User',
      review_text: review_text.trim(),
      created_at,
      expires_at,
      responses: [],
    };

    if (!db.reviews) db.reviews = [];
    db.reviews.unshift(newReview);
    saveDb(db);

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
