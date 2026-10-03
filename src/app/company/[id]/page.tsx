import { notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/realCompanyService';
import { CompanyProfileView } from './CompanyProfileView';

export default async function CompanyProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  return <CompanyProfileView company={company} />;
}
