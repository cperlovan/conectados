-- Script to add missing month and year columns to Receipts table
-- You can run this directly in your PostgreSQL client

-- Add month column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Receipts' AND column_name = 'month'
    ) THEN
        ALTER TABLE "Receipts" ADD COLUMN "month" INTEGER;
    END IF;
END $$;

-- Add year column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Receipts' AND column_name = 'year'
    ) THEN
        ALTER TABLE "Receipts" ADD COLUMN "year" INTEGER;
    END IF;
END $$;

-- Set default values for existing records 
-- (optional - you can modify this to set appropriate values)
UPDATE "Receipts"
SET "month" = EXTRACT(MONTH FROM "createdAt"),
    "year" = EXTRACT(YEAR FROM "createdAt")
WHERE "month" IS NULL OR "year" IS NULL;

-- Confirm columns were added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Receipts' 
ORDER BY ordinal_position; 