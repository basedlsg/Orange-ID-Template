CREATE TABLE `cities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`city_ascii` text,
	`country` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`timezone_str` text NOT NULL,
	`population` integer,
	`admin_name` text,
	`iso2` text,
	`iso3` text,
	`capital` text
);