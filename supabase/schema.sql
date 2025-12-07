-- MMC-MMS Database Schema for Supabase
-- Medical Queue Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(12) UNIQUE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    exam_type VARCHAR(50) DEFAULT 'recruitment',
    route JSONB,
    current_clinic VARCHAR(50),
    current_index INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

-- PINs Table
CREATE TABLE IF NOT EXISTS pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic VARCHAR(50) NOT NULL,
    pin VARCHAR(2) NOT NULL,
    date DATE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic, date)
);

-- Queue Table
CREATE TABLE IF NOT EXISTS queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic VARCHAR(50) NOT NULL,
    patient_id VARCHAR(12) NOT NULL,
    number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'NEAR_TURN', 'IN_SERVICE', 'DONE', 'COMPLETED')),
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(clinic, patient_id)
);

-- Activities Log Table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(12) NOT NULL,
    clinic VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_pins_clinic_date ON pins(clinic, date);
CREATE INDEX IF NOT EXISTS idx_queue_clinic ON queue(clinic);
CREATE INDEX IF NOT EXISTS idx_queue_patient_id ON queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
CREATE INDEX IF NOT EXISTS idx_activities_patient_id ON activities(patient_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policies for public access (adjust as needed for production)
CREATE POLICY "Enable read access for all users" ON patients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON patients FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON pins FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON pins FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON queue FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON queue FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON queue FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON activities FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON activities FOR INSERT WITH CHECK (true);

-- Insert initial data (example)
-- This will be handled by the API endpoints dynamically
