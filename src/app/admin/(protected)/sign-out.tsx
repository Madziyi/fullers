'use client';
import { signOut } from 'next-auth/react';
export function SignOut() {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void signOut({ callbackUrl: '/admin/login' });
      }}
    >
      <button>Sign out</button>
    </form>
  );
}
