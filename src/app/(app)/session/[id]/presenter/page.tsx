import { PresenterView } from '@/components/presenter';

interface PresenterPageProps {
    params: Promise<{ id: string }>;
}

export default async function PresenterPage({ params }: PresenterPageProps) {
    const { id } = await params;

    // In production, fetch session details from database
    // For now, use the ID as title
    const sessionTitle = 'Live Presentation';

    return <PresenterView sessionId={id} sessionTitle={sessionTitle} />;
}
