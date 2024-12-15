-- Custom SQL migration file, put you code below! --

-- Upgrade: Change start_date and end_date to TIMESTAMP with random values
-- Assign random timestamps within a defined range (e.g., last 5 years)
UPDATE planicamping_activity
SET start_date = NOW() - (random() * (365 * 5) * INTERVAL '1 day'),
    end_date = start_date + (random() * INTERVAL '30 days');

-- Alter the column types after populating the random timestamps
ALTER TABLE planicamping_activity
ALTER COLUMN start_date TYPE TIMESTAMP USING start_date::TIMESTAMP;
ALTER TABLE planicamping_activity
ALTER COLUMN end_date TYPE TIMESTAMP USING end_date::TIMESTAMP;

-- Downgrade: Change start_date and end_date back to DATE
-- Uncomment these lines if you need to revert the migration
-- ALTER TABLE my_table
-- ALTER COLUMN start_date TYPE DATE USING start_date::DATE;
-- ALTER TABLE my_table
-- ALTER COLUMN end_date TYPE DATE USING end_date::DATE;