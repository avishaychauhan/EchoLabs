import { EchoLensInterface } from '@/components/echolens';

interface PresenterPageProps {
    params: Promise<{ id: string }>;
}

export default async function PresenterPage({ params }: PresenterPageProps) {
    const { id } = await params;
    return <EchoLensInterface sessionId={id} />;
}

