import { PowerSyncDatabase, PowerSyncBackendConnector } from '@powersync/web';
import { createClient } from '@/lib/supabase/client';

// PowerSync schema definition
const SCHEMA = `
--sync work_orders
CREATE TABLE IF NOT EXISTS work_orders (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT,
    assigned_mechanic_id TEXT,
    priority TEXT,
    status TEXT,
    type TEXT,
    title TEXT,
    description TEXT,
    issue_type TEXT,
    estimated_hours REAL,
    actual_hours REAL,
    cost REAL,
    created_by TEXT,
    created_at TEXT,
    updated_at TEXT,
    closed_at TEXT
);

--sync vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    vin TEXT,
    status TEXT,
    garage_id TEXT,
    current_driver_id TEXT,
    winterized_bool INTEGER,
    make TEXT,
    model TEXT,
    year INTEGER,
    odometer INTEGER,
    created_at TEXT,
    updated_at TEXT
);

--sync inventory_stock
CREATE TABLE IF NOT EXISTS inventory_stock (
    id TEXT PRIMARY KEY,
    inventory_item_id TEXT,
    garage_id TEXT,
    quantity_on_hand INTEGER,
    reserved_quantity INTEGER,
    location TEXT,
    updated_at TEXT
);
`;

class SupabaseConnector implements PowerSyncBackendConnector {
  private supabase = createClient();

  async fetchCredentials() {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (!session) {
      throw new Error('No session found');
    }

    // In a real implementation, you would call your PowerSync backend
    // to get the PowerSync token using the Supabase session
    // For now, we'll return a placeholder structure
    return {
      endpoint: process.env.NEXT_PUBLIC_POWERSYNC_URL || '',
      token: session.access_token,
      userID: session.user.id,
    };
  }

  async uploadData(database: PowerSyncDatabase) {
    // Upload local changes to Supabase
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    try {
      // Process each operation in the transaction
      for (const op of transaction.crud) {
        if (op.op === 'PUT' || op.op === 'PATCH') {
          // Upsert to Supabase
          const { error } = await this.supabase
            .from(op.table)
            .upsert(op.opData, { onConflict: 'id' });

          if (error) throw error;
        } else if (op.op === 'DELETE') {
          // Delete from Supabase
          const { error } = await this.supabase
            .from(op.table)
            .delete()
            .eq('id', op.id);

          if (error) throw error;
        }
      }

      // Mark transaction as complete
      await transaction.complete();
    } catch (error) {
      console.error('Upload error:', error);
      await transaction.rollback();
      throw error;
    }
  }
}

let powerSyncInstance: PowerSyncDatabase | null = null;

export async function getPowerSyncDatabase(): Promise<PowerSyncDatabase> {
  if (powerSyncInstance) {
    return powerSyncInstance;
  }

  const connector = new SupabaseConnector();
  const credentials = await connector.fetchCredentials();

  powerSyncInstance = new PowerSyncDatabase({
    schema: SCHEMA,
    database: {
      dbFilename: 'powersync.db',
    },
    connector: {
      endpoint: credentials.endpoint,
      parameters: async () => ({
        token: credentials.token,
        userID: credentials.userID,
      }),
      uploadData: connector.uploadData.bind(connector),
    },
  });

  await powerSyncInstance.init();

  return powerSyncInstance;
}

