CREATE TABLE timezone_offsets (
	"name"   VARCHAR(32) NOT NULL,
	"offset" smallint    NOT NULL,

	CONSTRAINT "PK_timezone_offsets" PRIMARY KEY ("name")
);

INSERT INTO timezone_offsets
SELECT
	name,
	EXTRACT(HOUR FROM utc_offset)::smallint AS offset
FROM pg_timezone_names
WHERE name IN (
	'Europe/Kaliningrad',
	'Europe/Moscow',
	'Europe/Samara',
	'Asia/Yekaterinburg',
	'Asia/Omsk',
	'Asia/Krasnoyarsk',
	'Asia/Irkutsk',
	'Asia/Yakutsk',
	'Asia/Vladivostok',
	'Asia/Magadan',
	'Asia/Kamchatka',
	'Europe/Berlin',
	'Europe/London',
	'Atlantic/Cape_Verde',
	'America/Noronha',
	'America/Argentina/Buenos_Aires',
	'America/Halifax',
	'America/New_York',
	'America/Chicago',
	'America/Denver',
	'America/Los_Angeles',
	'America/Anchorage',
	'Pacific/Honolulu',
	'Pacific/Pago_Pago'
);

ALTER TABLE regions
ADD CONSTRAINT fk_regions_timezone_offsets
FOREIGN KEY (timezone)
REFERENCES timezone_offsets(name);

ALTER TABLE cities
ADD CONSTRAINT fk_cities_timezone_offsets
FOREIGN KEY (own_timezone)
REFERENCES timezone_offsets(name);
