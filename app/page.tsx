import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">SuperOzono CRM</h1>
      <p className="text-sm text-gray-600">
        Accede al dashboard para gestionar leads y mensajería.
      </p>
      <Link className="rounded border px-4 py-2 text-sm" href="/login">
        Ir a Login
      </Link>
    </div>
  );
}
