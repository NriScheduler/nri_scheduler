ALTER TABLE cities
DROP CONSTRAINT fk_cities_timezone_offsets;

ALTER TABLE regions
DROP CONSTRAINT fk_regions_timezone_offsets;

DROP TABLE timezone_offsets;
