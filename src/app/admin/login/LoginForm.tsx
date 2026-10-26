'use client';
import { useState } from 'react';

export default function LoginForm({ error }: { error?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <form
      method="POST"
      action="/admin/api/auth/login"
      className="space-y-5"
      onSubmit={() => setPending(true)}
    >
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-900">{error}</div>
      )}
      <div className="space-y-2">
        <label className="text-[#0d1b3e] font-semibold">E-Mail-Adresse</label>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          placeholder="name@kuiper-safety.de"
          className="w-full bg-slate-50 border border-slate-200 text-[#0d1b3e] h-12 rounded-xl px-3 focus:ring-2 focus:ring-[#00C2FF] outline-none transition"
        />
      </div>
      <div className="space-y-2">
        <label className="text-[#0d1b3e] font-semibold">Passwort</label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full bg-slate-50 border border-slate-200 text-[#0d1b3e] h-12 rounded-xl px-3 focus:ring-2 focus:ring-[#00C2FF] outline-none transition"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 mt-1 bg-[#0d1b3e] hover:opacity-90 text-white font-bold text-base rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 inline-flex justify-center items-center gap-2"
      >
        {pending ? 'Anmeldung…' : 'Anmelden'}
      </button>
    </form>
  );
}
