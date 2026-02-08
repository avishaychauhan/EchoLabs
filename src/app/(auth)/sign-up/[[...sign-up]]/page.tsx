import { redirect } from 'next/navigation';

export default function SignUpPage() {
    // Redirect to Auth0 signup
    redirect('/api/auth/login?screen_hint=signup');
}
