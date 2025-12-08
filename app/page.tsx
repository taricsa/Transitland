import Link from 'next/link';
import { 
  ChartBarIcon, 
  WifiIcon, 
  UserGroupIcon, 
  SparklesIcon,
  TruckIcon 
} from '@heroicons/react/24/outline';

export default function Home() {
  const features = [
    {
      name: 'Real-time Visibility',
      description: 'Monitor fleet status, work orders, and inventory in real-time',
      icon: ChartBarIcon,
    },
    {
      name: 'Offline-First',
      description: 'Full functionality without internet connection',
      icon: WifiIcon,
    },
    {
      name: 'Role-Based Views',
      description: 'Tailored dashboards for mechanics, managers, clerks, and drivers',
      icon: UserGroupIcon,
    },
    {
      name: 'Smart Automation',
      description: 'Auto-priority assignment and winterization protocols',
      icon: SparklesIcon,
    },
  ];

  return (
    <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center text-center p-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Badge */}
        <span className="inline-block py-1 px-3 rounded-full bg-blue-900/30 text-blue-400 text-sm font-semibold mb-6 border border-blue-800">
          Fleet Management Platform
        </span>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
          Transitland
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Proactive, data-driven fleet orchestration for modern transit operations.
        </p>

        {/* CTA Button */}
        <Link
          href="/login"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all mb-16"
        >
          Sign In to Fleet OS
        </Link>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.name}
                className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-sm hover:border-slate-700 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 rounded-lg bg-blue-500/20 p-2.5">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white mb-1.5">
                      {feature.name}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

