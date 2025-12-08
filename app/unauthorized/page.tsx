import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">403</h1>
        <p className="mt-4 text-lg text-gray-600">Unauthorized Access</p>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to access this page.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

