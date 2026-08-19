PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_username_redirect` (
	`old_username` text PRIMARY KEY NOT NULL,
	`profile_id` text,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_username_redirect`("old_username", "profile_id", "expires_at", "created_at") SELECT "old_username", "profile_id", "expires_at", "created_at" FROM `username_redirect`;--> statement-breakpoint
DROP TABLE `username_redirect`;--> statement-breakpoint
ALTER TABLE `__new_username_redirect` RENAME TO `username_redirect`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `username_redirect_profile_idx` ON `username_redirect` (`profile_id`);