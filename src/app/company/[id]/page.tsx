'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { CompanyProfileView } from './CompanyProfileView';

export default function CompanyProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const company = MOCK_COMPANIES.find((c) => c.id === id);

  if (!company) {
    notFound();
  }

  return <CompanyProfileView company={company} />;
}
