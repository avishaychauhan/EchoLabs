import { redirect } from 'next/navigation';

export default function SignInPage() {
    // Redirect to Auth0 login
    redirect('/api/auth/login');
}
