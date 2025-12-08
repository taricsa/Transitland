'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DVIRForm } from '@/components/features/driver/DVIRForm';
import { IssueReportWizard } from '@/components/features/driver/IssueReportWizard';
import { Vehicle } from '@/types';
import { VehicleCard } from '@/components/features/vehicles/VehicleCard';
import { ClipboardDocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function DriverDashboard() {
  const supabase = createClient();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [showDVIR, setShowDVIR] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDriverData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();
        if (userData) {
          const typedUserData = userData as { id: string };
          const { data: driverData } = await supabase
            .from('drivers')
            .select('id, current_vehicle_id')
            .eq('user_id', typedUserData.id)
            .single();
          if (driverData) {
            const typedDriverData = driverData as { id: string; current_vehicle_id?: string | null };
            setDriverId(typedDriverData.id);
            if (typedDriverData.current_vehicle_id) {
              const { data: vehicleData } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', typedDriverData.current_vehicle_id)
                .single();
              if (vehicleData) {
                setVehicle(vehicleData as Vehicle);
              }
            }
          }
        }
      }
      setLoading(false);
    }
    loadDriverData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Driver Portal</h1>
          <p className="mt-2 text-sm text-gray-600">
            Complete inspections and report issues
          </p>
        </div>

        {vehicle ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Assigned Vehicle</h2>
              <VehicleCard vehicle={vehicle} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => setShowDVIR(true)}
                className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <ClipboardDocumentCheckIcon className="h-12 w-12 text-indigo-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">Pre-Trip Inspection</h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Complete Digital Vehicle Inspection Report (DVIR)
                </p>
              </button>

              <button
                onClick={() => setShowIssueReport(true)}
                className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">Report Issue</h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Report a problem with your vehicle
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-yellow-50 p-6 text-center">
            <p className="text-yellow-800">No vehicle assigned</p>
          </div>
        )}

        {/* DVIR Modal */}
        <Dialog open={showDVIR} onClose={() => setShowDVIR(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-2xl rounded bg-white p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold">Pre-Trip Inspection (DVIR)</Dialog.Title>
                <button
                  onClick={() => setShowDVIR(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              {vehicle && (
                <DVIRForm
                  vehicleId={vehicle.id}
                  onSuccess={() => setShowDVIR(false)}
                />
              )}
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Issue Report Modal */}
        <Dialog open={showIssueReport} onClose={() => setShowIssueReport(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-2xl rounded bg-white p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold">Report Issue</Dialog.Title>
                <button
                  onClick={() => setShowIssueReport(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              {vehicle && (
                <IssueReportWizard
                  vehicleId={vehicle.id}
                  onSuccess={() => setShowIssueReport(false)}
                />
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

