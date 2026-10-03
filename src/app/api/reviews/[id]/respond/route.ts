import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { PublicReview } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { author_name, response_text } = body;

    if (!response_text) {
      return NextResponse.json({ error: 'response_text is required' }, { status: 400 });
    }

    const db = getDb();
    const reviews: PublicReview[] = db.reviews || [];
    const reviewIndex = reviews.findIndex((r) => r.id === id);

    if (reviewIndex === -1) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const now = new Date().toISOString().split('T')[0];
    const newResponse = {
      id: `resp_${Date.now()}`,
      author_name: author_name?.trim() || 'Company Owner',
      response_text: response_text.trim(),
      created_at: now,
    };

    if (!reviews[reviewIndex].responses) {
      reviews[reviewIndex].responses = [];
    }

    reviews[reviewIndex].responses!.push(newResponse);
    saveDb(db);

    return NextResponse.json(reviews[reviewIndex], { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post response' }, { status: 500 });
  }
}
