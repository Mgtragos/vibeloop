import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white">
      <h1 className="text-5xl font-bold tracking-tight text-brand-900">VibeLoop</h1>
      <p className="mt-4 text-lg text-gray-500">Real-time video chat with strangers</p>
      <Link
        href="/chat"
        className="mt-10 rounded-2xl bg-brand-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-sky-600 active:scale-95"
      >
        Start Chatting
      </Link>
    </main>
  );
}
