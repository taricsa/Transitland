import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-5xl font-bold text-gray-900">Transitland Fleet OS</h1>
          <p className="mt-4 text-xl text-gray-600">Fleet Operating System</p>
          <p className="mt-2 text-sm text-gray-500">
            Proactive, data-driven fleet orchestration for modern transit operations
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/login"
            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:w-auto sm:px-8"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Real-time Visibility</h3>
            <p className="mt-2 text-sm text-gray-600">
              Monitor fleet status, work orders, and inventory in real-time
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Offline-First</h3>
            <p className="mt-2 text-sm text-gray-600">
              Full functionality without internet connection
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Role-Based Views</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tailored dashboards for mechanics, managers, clerks, and drivers
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Smart Automation</h3>
            <p className="mt-2 text-sm text-gray-600">
              Auto-priority assignment and winterization protocols
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

