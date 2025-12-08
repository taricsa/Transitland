'use client';

import { DashboardMetrics } from '@/lib/hooks/useRealtimeDashboard';
import { TruckIcon, WrenchScrewdriverIcon, SnowflakeIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface KPICardsProps {
  metrics: DashboardMetrics;
}

export function KPICards({ metrics }: KPICardsProps) {
  const kpis = [
    {
      name: 'Fleet Availability',
      value: `${metrics.availabilityRate.toFixed(1)}%`,
      description: `${metrics.availableVehicles} of ${metrics.totalVehicles} available`,
      icon: TruckIcon,
      color: 'bg-green-500',
      trend: metrics.availabilityRate >= 92 ? 'good' : 'needs-attention',
    },
    {
      name: 'Mechanic Utilization',
      value: `${metrics.mechanicUtilization.toFixed(1)}%`,
      description: `${metrics.openWorkOrders} open work orders`,
      icon: WrenchScrewdriverIcon,
      color: 'bg-blue-500',
      trend: 'neutral',
    },
    {
      name: 'Winter Readiness',
      value: `${metrics.winterReadiness.toFixed(1)}%`,
      description: 'Vehicles winterized',
      icon: SnowflakeIcon,
      color: 'bg-indigo-500',
      trend: metrics.winterReadiness >= 100 ? 'good' : 'needs-attention',
    },
    {
      name: 'Critical Issues',
      value: metrics.criticalWorkOrders.toString(),
      description: 'P0 work orders',
      icon: ChartBarIcon,
      color: 'bg-red-500',
      trend: metrics.criticalWorkOrders === 0 ? 'good' : 'needs-attention',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.name}
          className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
        >
          <div className="flex items-center">
            <div className={`${kpi.color} rounded-md p-3`}>
              <kpi.icon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">{kpi.name}</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{kpi.value}</div>
                </dd>
                <dd className="text-sm text-gray-500">{kpi.description}</dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

