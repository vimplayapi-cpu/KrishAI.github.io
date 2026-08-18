CREATE TABLE `demoAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `demoAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `demoAccounts_username_unique` UNIQUE(`username`)
);
