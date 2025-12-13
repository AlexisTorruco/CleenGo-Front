// app/provider/[id]/page.tsx
import PublicProviderProfile from '@/app/components/PublicProviderProfile';

export default function ProviderPage({ params }: { params: { id: string } }) {
  return <PublicProviderProfile providerId={params.id} />;
}
