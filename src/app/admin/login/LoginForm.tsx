'use client';
import { useState } from 'react';

export default function LoginForm({ error }: { error?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <form
      method="POST"
      action="/admin/api/auth/login"
      className="space-y-4"
      onSubmit={() => setPending(true)}
    >
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">E-Mail</label>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Passwort</label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition disabled:opacity-50"
      >
        {pending ? 'Anmeldung…' : 'Anmelden'}
      </button>
    </form>
  );
}
