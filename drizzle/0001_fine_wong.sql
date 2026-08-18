CREATE TABLE `aiConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text,
	`sources` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`resource` varchar(200),
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`variety` varchar(200),
	`stage` enum('land_preparation','sowing','germination','vegetative','flowering','fruiting','maturity','harvest','post_harvest') NOT NULL DEFAULT 'land_preparation',
	`plantedAt` timestamp,
	`expectedHarvestAt` timestamp,
	`area` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diseaseAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`crop` varchar(200),
	`result` json,
	`confidence` int,
	`images` json,
	`savedReport` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diseaseAnalyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`state` varchar(100),
	`district` varchar(100),
	`village` varchar(200),
	`farmSize` text,
	`soilType` varchar(100),
	`irrigation` varchar(100),
	`farmingMethod` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeDocs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(400) NOT NULL,
	`body` text,
	`source` varchar(400),
	`organization` varchar(200),
	`crop` varchar(200),
	`topic` varchar(200),
	`state` varchar(100),
	`language` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledgeDocs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(200) NOT NULL,
	`data` json,
	`provider` varchar(50),
	`fetchedAt` timestamp NOT NULL,
	CONSTRAINT `marketCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketCache_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`body` text,
	`category` varchar(50),
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`targetCrops` text,
	`targetProblems` text,
	`caution` text,
	`source` varchar(300),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('crop','disease','farm','weather','market','research') NOT NULL,
	`title` varchar(300),
	`body` text,
	`aiGenerated` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedPapers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`url` text,
	`doi` varchar(200),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedPapers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `uploadedFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmId` int,
	`category` varchar(50),
	`url` text NOT NULL,
	`fileKey` varchar(400) NOT NULL,
	`mimeType` varchar(100),
	`size` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploadedFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userType` varchar(32),
	`mobile` varchar(20),
	`state` varchar(100),
	`district` varchar(100),
	`village` varchar(200),
	`pincode` varchar(10),
	`onboardingComplete` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weatherCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationKey` varchar(200) NOT NULL,
	`data` json,
	`provider` varchar(50),
	`fetchedAt` timestamp NOT NULL,
	CONSTRAINT `weatherCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `weatherCache_locationKey_unique` UNIQUE(`locationKey`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('farmer','student','researcher','professional','business','admin','user') NOT NULL DEFAULT 'farmer';