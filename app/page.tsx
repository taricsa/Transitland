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
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Offline-First',
      description: 'Full functionality without internet connection',
      icon: WifiIcon,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Role-Based Views',
      description: 'Tailored dashboards for mechanics, managers, clerks, and drivers',
      icon: UserGroupIcon,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      name: 'Smart Automation',
      description: 'Auto-priority assignment and winterization protocols',
      icon: SparklesIcon,
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
              <TruckIcon className="h-4 w-4" />
              <span>Fleet Management Platform</span>
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Transitland Fleet OS
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-xl text-slate-300">
              Proactive, data-driven fleet orchestration for modern transit operations
            </p>
            
            <div className="flex justify-center gap-4 pt-4">
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative">Sign In</span>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.name}
                  className="group relative overflow-hidden rounded-2xl bg-white/5 p-6 backdrop-blur-sm ring-1 ring-white/10 transition-all duration-300 hover:bg-white/10 hover:ring-white/20 hover:scale-105"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} p-3 text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{feature.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

