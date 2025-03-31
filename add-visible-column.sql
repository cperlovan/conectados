-- Verificar si la columna visible ya existe en la tabla Receipts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Receipts'
        AND column_name = 'visible'
    ) THEN
        -- Añadir la columna visible
        ALTER TABLE "Receipts" ADD COLUMN "visible" BOOLEAN DEFAULT FALSE;
        
        -- Opcionalmente, actualizar los recibos existentes a un valor específico
        -- Por defecto todos los recibos existentes serán no visibles (FALSE)
        -- Descomenta la siguiente línea si quieres modificar el comportamiento
        -- UPDATE "Receipts" SET "visible" = TRUE;
        
        RAISE NOTICE 'La columna visible ha sido añadida a la tabla Receipts';
    ELSE
        RAISE NOTICE 'La columna visible ya existe en la tabla Receipts';
    END IF;
END $$;

-- Verificar que la columna se añadió correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Receipts' AND column_name = 'visible'; 