CREATE TABLE `usage_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number_id` int NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`contact_count` int NOT NULL DEFAULT 45,
	`used_at` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`was_blocked` int NOT NULL DEFAULT 0,
	CONSTRAINT `usage_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_numbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`display_name` varchar(50),
	`status` enum('available','cooldown','blocked') NOT NULL DEFAULT 'available',
	`last_used_at` timestamp,
	`last_contact_count` int DEFAULT 0,
	`blocked_until` timestamp,
	`is_sensitive` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_numbers_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_numbers_phone_number_unique` UNIQUE(`phone_number`)
);
