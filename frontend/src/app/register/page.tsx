'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?mode=register');
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-t-transparent border-violet-500 rounded-full animate-spin" />
        <span className="text-sm font-medium tracking-wide">Loading StudyCircle...</span>
      </div>
    </div>
  );
}
