'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasValidStoredAuthToken } from '@/lib/auth';

// Import the actual assessment content component
import AssessmentForm from './AssessmentForm';

export default function AssessmentPageWrapper() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    function checkAuth() {
      if (!hasValidStoredAuthToken()) {
        router.replace('/auth');
        return;
      }

      if (mounted) {
        setCheckingAuth(false);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-[calc(100vh_-_var(--app-navbar-height))] items-center justify-center p-6 text-[color:var(--foreground)]">
        Checking authentication...
      </div>
    );
  }

  return <AssessmentForm />;
}
