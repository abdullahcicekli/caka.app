CREATE TABLE `github_calendar` (
	`login` text PRIMARY KEY NOT NULL,
	`payload` text,
	`fetched_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
