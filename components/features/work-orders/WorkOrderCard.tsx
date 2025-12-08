import { WorkOrder } from '@/types';
import { format } from 'date-fns';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  P0: 'bg-red-100 text-red-800 border-red-200',
  P1: 'bg-orange-100 text-orange-800 border-orange-200',
  P2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  P3: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusColors: Record<string, string> = {
  Open: 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Waiting: 'bg-yellow-100 text-yellow-800',
  Closed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export function WorkOrderCard({ workOrder, onClick }: WorkOrderCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
            <WrenchScrewdriverIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {workOrder.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {workOrder.type} • {workOrder.issue_type || 'General'}
            </p>
            {workOrder.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {workOrder.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityColors[workOrder.priority]}`}
              >
                {workOrder.priority}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[workOrder.status]}`}
              >
                {workOrder.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Created {format(new Date(workOrder.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

