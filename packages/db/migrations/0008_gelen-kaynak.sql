CREATE TABLE `profile_referrer_daily` (
	`profile_id` text NOT NULL,
	`day` text NOT NULL,
	`source` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`profile_id`, `day`, `source`),
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade
);
