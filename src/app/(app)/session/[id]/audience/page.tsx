import { AudienceView } from '@/components/audience';

interface AudiencePageProps {
    params: Promise<{ id: string }>;
}

export default async function AudiencePage({ params }: AudiencePageProps) {
    const { id } = await params;

    // In production, fetch session details and verify access
    const sessionTitle = 'Live Presentation';

    return <AudienceView sessionId={id} sessionTitle={sessionTitle} />;
}
