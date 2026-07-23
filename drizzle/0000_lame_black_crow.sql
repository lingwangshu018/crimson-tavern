CREATE TABLE `tavern_vaults` (
	`owner_key_hash` text PRIMARY KEY NOT NULL,
	`read_key_hash` text NOT NULL,
	`payload` text NOT NULL,
	`record_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tavern_vaults_read_key_hash_idx` ON `tavern_vaults` (`read_key_hash`);