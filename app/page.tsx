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
      color: 'blue',
    },
    {
      name: 'Offline-First',
      description: 'Full functionality without internet connection',
      icon: WifiIcon,
      color: 'purple',
    },
    {
      name: 'Role-Based Views',
      description: 'Tailored dashboards for mechanics, managers, clerks, and drivers',
      icon: UserGroupIcon,
      color: 'green',
    },
    {
      name: 'Smart Automation',
      description: 'Auto-priority assignment and winterization protocols',
      icon: SparklesIcon,
      color: 'orange',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-slate-950 to-slate-950"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      
      <div className="relative flex min-h-screen flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="w-full max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/20">
              <TruckIcon className="h-3.5 w-3.5" />
              <span>Fleet Management Platform</span>
            </div>
            
            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-white">Transitland</span>
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Fleet OS
                </span>
              </h1>
              
              <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-400 leading-relaxed">
                Proactive, data-driven fleet orchestration for modern transit operations
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                const colorConfig = {
                  blue: {
                    card: 'bg-blue-500/10 border-blue-500/20',
                    iconBg: 'bg-blue-500/20',
                    icon: 'text-blue-400',
                  },
                  purple: {
                    card: 'bg-purple-500/10 border-purple-500/20',
                    iconBg: 'bg-purple-500/20',
                    icon: 'text-purple-400',
                  },
                  green: {
                    card: 'bg-green-500/10 border-green-500/20',
                    iconBg: 'bg-green-500/20',
                    icon: 'text-green-400',
                  },
                  orange: {
                    card: 'bg-orange-500/10 border-orange-500/20',
                    iconBg: 'bg-orange-500/20',
                    icon: 'text-orange-400',
                  },
                };
                const colors = colorConfig[feature.color as keyof typeof colorConfig];
                
                return (
                  <div
                    key={feature.name}
                    className={`rounded-xl border p-6 transition-all hover:border-opacity-40 hover:scale-[1.02] ${colors.card}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 rounded-lg ${colors.iconBg} p-2.5`}>
                        <Icon className={`h-5 w-5 ${colors.icon}`} />
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
      </div>
    </div>
  );
}

