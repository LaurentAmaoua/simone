-- Custom SQL migration file, put you code below! --

-- Step 1: Update existing data to remove fractional seconds
UPDATE planicamping_activity
SET start_date = start_date::TIMESTAMP(0),
    end_date = end_date::TIMESTAMP(0);

-- Step 2: Alter column types to TIMESTAMP(0) to enforce no fractional seconds
ALTER TABLE planicamping_activity
ALTER COLUMN start_date TYPE TIMESTAMP(0) USING start_date::TIMESTAMP(0),
ALTER COLUMN end_date TYPE TIMESTAMP(0) USING end_date::TIMESTAMP(0);