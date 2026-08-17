CREATE TABLE `link_click_daily` (
	`profile_id` text NOT NULL,
	`block_id` text NOT NULL,
	`day` text NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`profile_id`, `day`, `block_id`),
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profile_view_daily` (
	`profile_id` text NOT NULL,
	`day` text NOT NULL,
	`country` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`profile_id`, `day`, `country`),
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE cascade
);
