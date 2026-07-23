CREATE TABLE `tavern_note_keys` (
	`note_key_hash` text PRIMARY KEY NOT NULL,
	`owner_key_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tavern_note_keys_owner_key_hash_idx` ON `tavern_note_keys` (`owner_key_hash`);