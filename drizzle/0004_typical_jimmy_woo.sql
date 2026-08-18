ALTER TABLE `diseaseAnalyses` ADD `status` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `diseaseAnalyses` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `diseaseAnalyses` ADD `reviewNote` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `status` enum('pending','approved','rejected') DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `reports` ADD `reviewNote` text;--> statement-breakpoint
ALTER TABLE `savedPapers` ADD `status` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `savedPapers` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `savedPapers` ADD `reviewNote` text;--> statement-breakpoint
ALTER TABLE `uploadedFiles` ADD `status` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `uploadedFiles` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `uploadedFiles` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `uploadedFiles` ADD `reviewNote` text;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `fullName` varchar(200);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `language` varchar(32) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `farmingExperienceYears` int;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `farmOwnerStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `soilType` varchar(100);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `rainfallType` varchar(50);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `growingSeason` varchar(100);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `irrigationAccess` varchar(50);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `cropsOfInterest` json;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `regionTags` json;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `aboutMe` text;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `age` int;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `universityName` varchar(300);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `enrollmentYear` int;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `degreeLevel` varchar(50);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `courseName` varchar(300);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `subjects` json;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `researchArea` varchar(300);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `graduationYear` int;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `purpose` varchar(100);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `onboardingAnswers` json;