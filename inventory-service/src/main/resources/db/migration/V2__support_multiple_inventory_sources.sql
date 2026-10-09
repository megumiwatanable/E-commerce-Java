ALTER TABLE inventory DROP INDEX product_id;
ALTER TABLE inventory ADD COLUMN source_code VARCHAR(50) NOT NULL DEFAULT 'MAIN' AFTER product_id;
CREATE UNIQUE INDEX uk_inventory_product_source ON inventory(product_id, source_code);
