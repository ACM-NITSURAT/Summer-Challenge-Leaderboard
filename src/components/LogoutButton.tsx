"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
    >
      Logout
    </button>
  );
}
