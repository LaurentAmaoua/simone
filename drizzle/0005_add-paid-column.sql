-- Custom SQL migration file, put you code below! --

-- Add a "paid" column to the "planicamping_activity" table and randomly populate with true or false
ALTER TABLE planicamping_activity ADD COLUMN paid BOOLEAN;
UPDATE planicamping_activity SET paid = (random() > 0.5);
