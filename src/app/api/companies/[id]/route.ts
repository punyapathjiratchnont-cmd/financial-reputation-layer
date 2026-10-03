import { NextResponse } from 'next/server';
import { getCompanyById } from '@/lib/realCompanyService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Company ID is required.' }, { status: 400 });
    }

    const company = await getCompanyById(id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve company profile.' },
      { status: 500 }
    );
  }
}
