-- Custom SQL migration file, put you code below! --

-- Step 1: Update start_date and end_date to random dates within 2025
UPDATE planicamping_activity
SET start_date = (
        '2025-01-01'::DATE + (random() * INTERVAL '365 days')::INTERVAL
    ),
    end_date = (
        start_date + (random() * INTERVAL '2 days')::INTERVAL
    )
WHERE start_date IS NOT NULL AND end_date IS NOT NULL;

-- Note: Replace '365 days' and '30 days' with appropriate intervals if required.