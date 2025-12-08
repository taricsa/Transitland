-- Transitland Fleet OS - Analytics Tables (OLAP)
-- These tables are populated via nightly cron jobs or database triggers

-- Daily Garage Stats (Fleet Health Metrics)
CREATE TABLE daily_garage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    total_vehicles INTEGER NOT NULL DEFAULT 0,
    vehicles_down INTEGER NOT NULL DEFAULT 0,
    vehicles_available INTEGER NOT NULL DEFAULT 0,
    vehicles_in_service INTEGER NOT NULL DEFAULT 0,
    vehicles_in_maintenance INTEGER NOT NULL DEFAULT 0,
    availability_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, garage_id)
);

-- Mechanic Daily Logs (Efficiency Tracking)
CREATE TABLE mechanic_daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    mechanic_id UUID NOT NULL REFERENCES mechanics(id) ON DELETE CASCADE,
    hours_logged DECIMAL(5,2) DEFAULT 0,
    tickets_closed INTEGER DEFAULT 0,
    wrench_efficiency_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, mechanic_id)
);

-- Driver Risk Scores (Driver Impact Scoring)
CREATE TABLE driver_risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month DATE NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    miles_driven INTEGER DEFAULT 0,
    avoidable_repair_count INTEGER DEFAULT 0,
    cost_per_mile DECIMAL(10,4) DEFAULT 0.0000,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(month, driver_id)
);

-- Stockout Events (Supply Chain Tracking)
CREATE TABLE stockout_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    part_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    hours_delayed DECIMAL(5,2) DEFAULT 0,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasonal Campaigns (Winterization Tracking)
CREATE TABLE seasonal_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_vehicles_count INTEGER NOT NULL DEFAULT 0,
    completed_vehicles_count INTEGER NOT NULL DEFAULT 0,
    garage_id UUID REFERENCES garages(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_daily_garage_stats_date ON daily_garage_stats(date);
CREATE INDEX idx_daily_garage_stats_garage ON daily_garage_stats(garage_id);
CREATE INDEX idx_mechanic_daily_logs_date ON mechanic_daily_logs(date);
CREATE INDEX idx_mechanic_daily_logs_mechanic ON mechanic_daily_logs(mechanic_id);
CREATE INDEX idx_driver_risk_scores_month ON driver_risk_scores(month);
CREATE INDEX idx_driver_risk_scores_driver ON driver_risk_scores(driver_id);
CREATE INDEX idx_stockout_events_garage ON stockout_events(garage_id);
CREATE INDEX idx_stockout_events_created ON stockout_events(created_at);
CREATE INDEX idx_seasonal_campaigns_status ON seasonal_campaigns(status);
CREATE INDEX idx_seasonal_campaigns_dates ON seasonal_campaigns(start_date, end_date);

-- Updated_at trigger for analytics tables
CREATE TRIGGER update_driver_risk_scores_updated_at BEFORE UPDATE ON driver_risk_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasonal_campaigns_updated_at BEFORE UPDATE ON seasonal_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

