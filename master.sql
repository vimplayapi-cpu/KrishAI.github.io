-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: gateway03.us-east-1.prod.aws.tidbcloud.com    Database: Ui29ti7bVRqra6SUANBaYr
-- ------------------------------------------------------
-- Server version	8.0.11-TiDB-v8.5.3-serverless

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=907992;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` VALUES (1,'814a08e40d7fc2bcfd458759d18319198ca8ae394f2fa15617a78678e9c9c93b',1786984817431);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `aiConversations`
--

DROP TABLE IF EXISTS `aiConversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aiConversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(300) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_aiConv_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=90001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aiConversations`
--

LOCK TABLES `aiConversations` WRITE;
/*!40000 ALTER TABLE `aiConversations` DISABLE KEYS */;
INSERT INTO `aiConversations` VALUES (1,1,'Hi','2026-08-18 00:24:24','2026-08-18 00:24:26'),(30001,1,'Best fertilizer schedule for wheat at flowering stage','2026-08-18 06:30:27','2026-08-18 06:30:29'),(60001,1,'What should I irrigate today given the forecast?','2026-08-18 10:06:41','2026-08-18 10:06:42');
/*!40000 ALTER TABLE `aiConversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `aiMessages`
--

DROP TABLE IF EXISTS `aiMessages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aiMessages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversationId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text DEFAULT NULL,
  `sources` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_aiMsg_convId` (`conversationId`),
  KEY `idx_aiMsg_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=90001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aiMessages`
--

LOCK TABLES `aiMessages` WRITE;
/*!40000 ALTER TABLE `aiMessages` DISABLE KEYS */;
INSERT INTO `aiMessages` VALUES (1,1,1,'user','Hi',NULL,'2026-08-18 00:24:24'),(2,1,1,'assistant','Hello! I am KrishAI, your agriculture advisor at KrishAI Hub. I can help you with crop management, farming practices, market context, weather interpretation, and agricultural research. How can I assist you with your farming needs today?','[{\"label\": \"INFERRED\", \"text\": \"General introductory greeting based on assistant persona.\"}]','2026-08-18 00:24:25'),(30001,30001,1,'user','Best fertilizer schedule for wheat at flowering stage',NULL,'2026-08-18 06:30:27'),(30002,30001,1,'assistant','I don\'t have reliable current data for this specific wheat flowering stage fertilizer schedule in the context. However, general agricultural guidance for wheat at later stages emphasizes careful water and stress management. Please consult your local agriculture officer or state agricultural university extension for specific fertilizer recommendations in your region.','[{\"label\": \"INFERRED\", \"text\": \"General agricultural knowledge base.\"}]','2026-08-18 06:30:28'),(60001,60001,1,'user','What should I irrigate today given the forecast?',NULL,'2026-08-18 10:06:41'),(60002,60001,1,'assistant','I don\'t have reliable current weather forecast data for your specific location to advise whether you should irrigate today. Please check your local IMD district rainfall outlook or consult a local agricultural officer.','[{\"label\": \"LIVE\", \"text\": \"Weather forecast context missing\"}]','2026-08-18 10:06:42');
/*!40000 ALTER TABLE `aiMessages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditLogs`
--

DROP TABLE IF EXISTS `auditLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditLogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `resource` varchar(200) DEFAULT NULL,
  `detail` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_audit_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=210001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditLogs`
--

LOCK TABLES `auditLogs` WRITE;
/*!40000 ALTER TABLE `auditLogs` DISABLE KEYS */;
INSERT INTO `auditLogs` VALUES (1,1,'advisor.ask','conversation:1',NULL,'2026-08-18 00:24:25'),(30001,1,'advisor.ask','conversation:30001',NULL,'2026-08-18 06:30:28'),(60001,1,'demo.login','auth','Demo login as demo','2026-08-18 06:50:57'),(60002,1,'demo.login','auth','Demo login as demo','2026-08-18 06:51:29'),(90001,1,'admin.setRole','user:1','user','2026-08-18 09:00:31'),(120001,1,'demo.login','auth','Demo login as demo','2026-08-18 10:06:15'),(120002,1,'advisor.ask','conversation:60001',NULL,'2026-08-18 10:06:42'),(120003,1,'admin.setSetting','siteTitle',NULL,'2026-08-18 10:09:10'),(150001,1,'admin.setRole','user:1','user','2026-08-18 10:53:23'),(180001,1,'demo.login','auth','Demo login as demo role=admin','2026-08-18 13:43:26');
/*!40000 ALTER TABLE `auditLogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crops`
--

DROP TABLE IF EXISTS `crops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `farmId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `variety` varchar(200) DEFAULT NULL,
  `stage` enum('land_preparation','sowing','germination','vegetative','flowering','fruiting','maturity','harvest','post_harvest') NOT NULL DEFAULT 'land_preparation',
  `plantedAt` timestamp NULL DEFAULT NULL,
  `expectedHarvestAt` timestamp NULL DEFAULT NULL,
  `area` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_crops_userId` (`userId`),
  KEY `idx_crops_farmId` (`farmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crops`
--

LOCK TABLES `crops` WRITE;
/*!40000 ALTER TABLE `crops` DISABLE KEYS */;
/*!40000 ALTER TABLE `crops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demoAccounts`
--

DROP TABLE IF EXISTS `demoAccounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demoAccounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `userId` int NOT NULL,
  `active` int NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastSelectedRole` enum('farmer','student','admin') NOT NULL DEFAULT 'farmer',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `demoAccounts_username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=120001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demoAccounts`
--

LOCK TABLES `demoAccounts` WRITE;
/*!40000 ALTER TABLE `demoAccounts` DISABLE KEYS */;
INSERT INTO `demoAccounts` VALUES (90001,'demo','8fc957c327d586ea9f4c3fd2ec605bcf:a3928c1b182e38b2dab916c0b82161a9b35b65efe62057a0dbf53e5004c29507',1,1,'2026-08-18 06:50:26','admin');
/*!40000 ALTER TABLE `demoAccounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diseaseAnalyses`
--

DROP TABLE IF EXISTS `diseaseAnalyses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diseaseAnalyses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `crop` varchar(200) DEFAULT NULL,
  `result` json DEFAULT NULL,
  `confidence` int DEFAULT NULL,
  `images` json DEFAULT NULL,
  `savedReport` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewedBy` int DEFAULT NULL,
  `reviewNote` text DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_disease_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diseaseAnalyses`
--

LOCK TABLES `diseaseAnalyses` WRITE;
/*!40000 ALTER TABLE `diseaseAnalyses` DISABLE KEYS */;
/*!40000 ALTER TABLE `diseaseAnalyses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farms`
--

DROP TABLE IF EXISTS `farms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `village` varchar(200) DEFAULT NULL,
  `farmSize` text DEFAULT NULL,
  `soilType` varchar(100) DEFAULT NULL,
  `irrigation` varchar(100) DEFAULT NULL,
  `farmingMethod` varchar(50) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_farms_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farms`
--

LOCK TABLES `farms` WRITE;
/*!40000 ALTER TABLE `farms` DISABLE KEYS */;
/*!40000 ALTER TABLE `farms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knowledgeDocs`
--

DROP TABLE IF EXISTS `knowledgeDocs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledgeDocs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(400) NOT NULL,
  `body` text DEFAULT NULL,
  `source` varchar(400) DEFAULT NULL,
  `organization` varchar(200) DEFAULT NULL,
  `crop` varchar(200) DEFAULT NULL,
  `topic` varchar(200) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `language` varchar(20) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knowledgeDocs`
--

LOCK TABLES `knowledgeDocs` WRITE;
/*!40000 ALTER TABLE `knowledgeDocs` DISABLE KEYS */;
INSERT INTO `knowledgeDocs` VALUES (1,'Rice Cultivation — Water Management in Transplanted Paddy','Intermittent irrigation (alternate wetting and drying, AWD) in transplanted rice reduces water use by 25–30% without yield loss when applied after panicle initiation. Maintain 2–3 cm standing water during flowering. Fields showing hairline cracks are suitable for re-irrigation. AWD reduces methane emissions and saves diesel/electric pumping costs. Monitor with field water tubes at 15 cm depth.','ICAR Directorate of Water Technology Application — AWD technical bulletin (public bulletin)','ICAR','Rice','Irrigation',NULL,'en','2026-08-17 16:54:20'),(2,'Wheat — Sowing Time and Heat Stress Management','Late-sown wheat (after 25 November in north-west plains) suffers terminal heat stress during grain filling, reducing grain weight. Use short-duration, heat-tolerant varieties (e.g., HD-3226, WH-1105) for late sowing and increase seed rate to 125 kg/ha. Zero-tillage with residue retention conserves moisture. Pre-sowing irrigation (pre-sowing soak) improves emergence in dry conditions.','ICAR IIWBR crop management recommendations (public extension material)','ICAR-IIWBR','Wheat','Sowing',NULL,'en','2026-08-17 16:54:20'),(3,'Tomato — Managing Leaf Curl Virus (ToLCNDV)','Tomato leaf curl New Delhi virus is transmitted by silverleaf whitefly (Bemisia tabaci). Control strategy: (1) raise seedlings under 40–50 mesh insect-proof net; (2) install yellow sticky traps at 12/acre; (3) remove and destroy infected plants early; (4) avoid planting near infected cucumber/bitter gourd fields; (5) spray registered insecticides against whitefly only when threshold (10 adults/trifoliate leaf) is crossed. Resistant varieties where available reduce dependence on sprays.','IIHR Bangalore tomato production technology bulletin (public bulletin)','ICAR-IIHR','Tomato','Disease',NULL,'en','2026-08-17 16:54:20'),(4,'Cotton — Integrated Pest Management for Bollworm Complex','Bollworm management in cotton should be integrated: pheromone traps (5/acre) for monitoring Helicoverpa and Pectinophora; release of Trichogramma egg parasitoids at weekly intervals from 45 days after sowing; conservation of natural enemies (ladybird, chrysoperla); mechanical collection of pink bollworm rosette flowers; and chemical control only when ETL (5% damaged squares/bolls) is crossed. Bt cotton remains effective against Helicoverpa but not pink bollworm — follow refuge strategy.','CICR Nagpur IPM package (public extension bulletin)','ICAR-CICR','Cotton','Pest',NULL,'en','2026-08-17 16:54:20'),(5,'Soil Health — Interpreting Soil Test Card Recommendations','Soil test cards from Soil Health Card scheme provide N-P-K ratings (Low/Medium/High). General correction guidance: Low N — apply recommended N in splits; Low P — apply 60–100 kg P2O5/ha basally with seed placement care; Low K — apply 40–60 kg K2O/ha. Secondary/micronutrient deficiency is common in intensive rice-wheat zones (Zn, S) and calcareous soils (Fe, Zn). Soil organic carbon below 0.5% needs regular organic amendment (FYM 10 t/ha or compost). Re-test every 2 years.','Ministry of Agriculture — Soil Health Card scheme technical document (public)','Govt of India',NULL,'Soil',NULL,'en','2026-08-17 16:54:20'),(6,'Fruit Crops — Flowering and Fruit Set Management in Mango','Mango flowering is induced by cool dry weather; erratic flowering can be regularized by paclobutrazol soil drench (2.5 g a.i./m canopy diameter) in October, followed by foliar sprays of boron (0.1%) and zinc (0.2%) at panicle emergence. Fruit set improves with pollinator activity — avoid spraying insecticides during flowering. Thin panicles to 2–3 per shoot in high-density orchards. Fruit fly management: methyl eugenol traps and bagging of fruit bunches.','ICAR-CISH Lucknow mango production guide (public extension material)','ICAR-CISH','Mango','Flowering',NULL,'en','2026-08-17 16:54:20'),(7,'Pulses — Rhizobium Inoculation and Nitrogen Fixation','Legume seeds (chickpea, pigeonpea, soybean, groundnut) should be inoculated with crop-specific rhizobium culture (peat/carrier-based, 200 g/10 kg seed) before sowing. Inoculation contributes 20–40 kg N/ha through biological fixation, reducing urea requirement by one-third. Use fresh culture within expiry; avoid mixing with fungicide seed treatments. Starter N of 15–20 kg/ha improves early nodulation in poor soils.','IIPR Kanpur pulse production technology (public bulletin)','ICAR-IIPR','Chickpea','Nutrition',NULL,'en','2026-08-17 16:54:20'),(8,'Vegetables — Protected Cultivation Basics for Smallholders','Low-cost polyhouse (400–800 m2, GI/wooden structure with 200 micron UV film) raises off-season vegetable yields 2–3x. Tomato, capsicum and cucumber are suited. Maintain 25–30 °C day temperature via side ventilation; drip with fertigation delivers soluble fertilizers. Net house (40–50 mesh) excludes fruit fly in cucurbits and chilli. Initial cost is partially subsidized under NHM/MIDH.','ICAR-IIHR protected cultivation bulletin (public bulletin)','ICAR-IIHR','Tomato','Protected cultivation',NULL,'en','2026-08-17 16:54:20'),(9,'Weather-Based Advisories — Interpreting IMD Rainfall Warnings for Farming','IMD issues district-level rainfall outlooks: \'isolated\' means <25% area, \'scattered\' 26–50%, \'widespread\' >50% of stations reporting rain. Heavy rainfall warning (orange) indicates 64.5–115.5 mm in 24 h — postpone spraying, secure harvested produce, drain waterlogged fields. For spray operations, wind speed above 15 km/h and rainfall probability above 40% in 24 h indicate unsuitable conditions. Frost warnings (yellow/orange) in rabi crops need irrigation or smoke/cover protection.','IMD Agromet Advisory Services technical note (public)','IMD',NULL,'Weather',NULL,'en','2026-08-17 16:54:20'),(10,'Post-Harvest — Reducing Grain Storage Losses','Paddy and wheat stored at above 12% moisture suffer insect (Rhyzopertha, Sitophilus) and fungal damage. Sun-dry to 12% (paddy) / 11% (wheat) moisture before storage. Hermetic storage (Purdue bags, metal bins) controls insects without chemicals. Fumigation with aluminium phosphide only by trained personnel following label — toxic gas, keep away from dwellings. First-in-first-out rotation and monthly inspection reduce losses from typical 5–8% to under 2%.','ICAR-CCRI post-harvest technology bulletin (public bulletin)','ICAR',NULL,'Post-harvest',NULL,'en','2026-08-17 16:54:20'),(11,'Organic Farming — Conversion Period and Certification Pathway','Conversion to certified organic farming requires 36 months (perennial) or 24 months (annuals) of chemical-free management under NPOP/PGS-India. During conversion, yields typically dip 10–25% before soil biology recovers. Key practices: green manuring (dhaincha/sunhemp), vermicompost, biopesticides (neem, Trichoderma), crop rotation with legumes, botanical sprays. PGS-India group certification suits smallholders; costs are shared. Organic premiums are market-dependent — secure buyer linkages before conversion.','APEDA NPOP/PGS-India operational manuals (public documents)','APEDA',NULL,'Organic',NULL,'en','2026-08-17 16:54:20'),(12,'Groundnut — Managing Taro Spot and Collar Rot in Rainy Season','Collar rot (Aspergillus niger) in groundnut peaks with rain soon after sowing. Preventive measures: seed treatment with Trichoderma viride (4 g/kg) or carbendazim (2 g/kg, non-organic), avoid waterlogged fields, maintain 30x10 cm spacing for airflow. Taro spot (Phoma arachidicola) needs early fungicide spray (mancozeb 2.5 g/L) at first symptoms. Harvest at 75–80% pod maturity to avoid in-pod germination during unseasonal rain.','ICAR-ICRISAT groundnut crop management (public bulletin)','ICAR-ICRISAT','Groundnut','Disease',NULL,'en','2026-08-17 16:54:20');
/*!40000 ALTER TABLE `knowledgeDocs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marketCache`
--

DROP TABLE IF EXISTS `marketCache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marketCache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(200) NOT NULL,
  `data` json DEFAULT NULL,
  `provider` varchar(50) DEFAULT NULL,
  `fetchedAt` timestamp NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `marketCache_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marketCache`
--

LOCK TABLES `marketCache` WRITE;
/*!40000 ALTER TABLE `marketCache` DISABLE KEYS */;
INSERT INTO `marketCache` VALUES (1,'market:*:*','{\"freshness\": \"LIVE\", \"provider\": \"Agri Exchange (agrimarket.gov.in)\", \"retrievedAt\": \"2026-08-18T00:24:31.293Z\", \"rows\": [{\"arrivalDate\": \"18/08/2026\", \"commodity\": \"Groundnut\", \"district\": \"Alluri Sitharama Raju\", \"market\": \"Chintapally APMC\", \"maxPrice\": 7500, \"minPrice\": 6500, \"modalPrice\": 7000, \"state\": \"Andhra Pradesh\", \"unit\": \"INR per quintal\", \"variety\": \"Local\"}, {\"arrivalDate\": \"18/08/2026\", \"commodity\": \"Banana\", \"district\": \"YSR Kadapa\", \"market\": \"Siddavatam APMC\", \"maxPrice\": 1700, \"minPrice\": 1500, \"modalPrice\": 1600, \"state\": \"Andhra Pradesh\", \"unit\": \"INR per quintal\", \"variety\": \"Medium\"}, {\"arrivalDate\": \"18/08/2026\", \"commodity\": \"Papaya\", \"district\": \"YSR Kadapa\", \"market\": \"Siddavatam APMC\", \"maxPrice\": 1500, \"minPrice\": 1300, \"modalPrice\": 1400, \"state\": \"Andhra Pradesh\", \"unit\": \"INR per quintal\", \"variety\": \"Papaya\"}, {\"arrivalDate\": \"18/08/2026\", \"commodity\": \"Paddy(Common)\", \"district\": \"Kakinada\", \"market\": \"Kakinada (Urban) APMC\", \"maxPrice\": 2390, \"minPrice\": 2369, \"modalPrice\": 2375, \"state\": \"Andhra Pradesh\", \"unit\": \"INR per quintal\", \"variety\": \"Common\"}]}','Agri Exchange','2026-08-18 00:24:31');
/*!40000 ALTER TABLE `marketCache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(300) NOT NULL,
  `body` text DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `read` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_notif_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(300) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `targetCrops` text DEFAULT NULL,
  `targetProblems` text DEFAULT NULL,
  `caution` text DEFAULT NULL,
  `source` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Neem Oil (Cold-pressed)','Biopesticide','Natural extract with azadirachtin; acts as antifeedant and growth disruptor against sucking pests. Used as foliar spray.','Tomato, Chilli, Cotton, Mango, Groundnut','Aphids, Whitefly, Jassids, Mites','Organic input; apply in early morning or evening. Verify OMPL/organic certification before use in certified organic farms.','ICAR National Centre of Organic Farming guidance'),(2,'Trichoderma viride (Bioagent)','Biofertilizer/Biocontrol','Fungal biocontrol agent applied as seed treatment or soil application to suppress soil-borne pathogens like Fusarium and Rhizoctonia.','Chickpea, Tur (Pigeonpea), Wheat, Tomato, Cotton','Fusarium wilt, Root rot, Collar rot','Do not mix with chemical fungicides at application; maintain 15-day gap.','ICAR NBPGR bioagent registration records'),(3,'Pseudomonas fluorescens','Biocontrol','Seed/soil-applied bacterium suppressing bacterial and fungal pathogens; also promotes growth via siderophore activity.','Rice, Wheat, Potato, Tomato','Bacterial blight, Sheath blight, Brown rot','Efficacy depends on early preventive application. Not a substitute for curative chemicals.','TNAU agronomy portal bio-inputs'),(4,'DAP (Di-Ammonium Phosphate 18-46-0)','Fertilizer','Phosphorus-rich basal fertilizer for early root development, applied at sowing below seed line.','Wheat, Rice, Maize, Cotton, Soybean','Phosphorus deficiency, Poor early root growth','Regulated fertilizer; follow state-recommended doses. Excess application causes micronutrient imbalance.','State Agriculture Department fertilizer recommendations'),(5,'Urea (46-0-0)','Fertilizer','Primary nitrogen source; top-dressed in splits aligned with crop growth stages.','Rice, Wheat, Maize, Sugarcane, Cotton','Nitrogen deficiency, Yellowing of leaves','Use neem-coated urea as per FCO norms. Do not apply before irrigation/rain; volatilization losses occur on dry soil.','Fertilizer Control Order (FCO) 1985'),(6,'MOP (Muriate of Potash 0-0-60)','Fertilizer','Potassium source improving disease resistance and fruit quality; applied basally or as top dressing.','Cotton, Sugarcane, Banana, Tomato, Potato','Potash deficiency, Poor fruit quality','Avoid application in chloride-sensitive crops at high doses.','Potash Research Institute of India guidance'),(7,'Zinc Sulphate (Heptahydrate)','Micronutrient','Corrects zinc deficiency common in calcareous and rice-wheat soils; soil or foliar application.','Rice, Maize, Wheat, Cotton','Zinc deficiency, Khaira disease in rice','Do not mix with phosphatic fertilizers at application; antagonism reduces availability.','IISS Bhopal micronutrient advisories'),(8,'Boric Acid / Solubor (Boron)','Micronutrient','Foliar boron corrects poor flowering and fruit set in fruiting crops.','Cotton, Chilli, Mango, Tomato, Mustard','Boron deficiency, Poor fruit set','Narrow safe range — overdose causes toxicity. Follow label dosage strictly.','State horticulture department micronutrient guides'),(9,'Imidacloprid 17.8% SL (registered formulation)','Insecticide','Systemic insecticide registered in India for sucking pest control in specified crops at notified doses.','Cotton, Tomato, Chilli','Aphids, Whitefly, Jassids','CIB&RC-registered use only. Follow label crop/dose/PHI. Toxic to bees — avoid flowering stage. Consult agriculture officer before use.','CIB&RC registration database'),(10,'Mancozeb 75% WP (registered formulation)','Fungicide','Broad-spectrum protective fungicide for foliar disease prevention in field crops and vegetables.','Potato, Tomato, Grapes, Wheat','Late blight, Early blight, Downy mildew','Protective (preventive) action only; start before disease onset. Observe label PHI and PPE requirements.','CIB&RC registration database'),(11,'Humic Acid (Liquid)','Biostimulant','Organic biostimulant improving nutrient uptake and soil microbial activity; applied via fertigation or foliar.','Sugarcane, Banana, Tomato, Cotton','Poor nutrient use efficiency, Soil health decline','Supplement, not substitute, for balanced fertilization.','ICAR IISS soil health guidance'),(12,'Drip Irrigation Kit (Lateral + Filters)','Irrigation','Pressurized micro-irrigation delivering water directly to root zone; subsidized under PMKSY per-drop-more-crop.','Sugarcane, Banana, Tomato, Chilli, Mango','Water scarcity, Waterlogging-free irrigation','Maintain filter cleaning schedule; sub-surface drip suits specific crops only.','PMKSY Per Drop More Crop scheme guidelines'),(13,'Vermicompost','Soil amendment','Organic manure from earthworm digestion; improves soil structure, moisture retention and microbial load.','All crops','Low organic carbon, Poor soil structure','Use fully matured product; immature vermicompost can cause seedling toxicity.','ICAR NCOF organic input standards'),(14,'Power Tiller / Mini Tractor','Farm equipment','Small-scale tillage equipment for land preparation on holdings up to 2 ha; available under SMAM subsidy.','All crops','Labour shortage, Timely land preparation','Custom hiring centres allow access without ownership. Operate with safety guards.','SMAM (Sub-Mission on Agricultural Mechanization) guidelines'),(15,'Knapsack Sprayer (Manual 16L)','Tools','Manual pressure sprayer for small-holder crop protection application.','All crops','Pest/disease spray application','Wear PPE. Calibrate nozzle before use. Never spray against wind.','PAU farm machinery guides');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `type` enum('crop','disease','farm','weather','market','research') NOT NULL,
  `title` varchar(300) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `aiGenerated` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  `reviewedBy` int DEFAULT NULL,
  `reviewNote` text DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_reports_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `savedPapers`
--

DROP TABLE IF EXISTS `savedPapers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `savedPapers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(500) NOT NULL,
  `url` text DEFAULT NULL,
  `doi` varchar(200) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewedBy` int DEFAULT NULL,
  `reviewNote` text DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_papers_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savedPapers`
--

LOCK TABLES `savedPapers` WRITE;
/*!40000 ALTER TABLE `savedPapers` DISABLE KEYS */;
INSERT INTO `savedPapers` VALUES (1,1,'Sustainable intensification for a larger global rice bowl','https://doi.org/10.1038/s41467-021-27424-z',NULL,NULL,'2026-08-18 10:52:46','pending',NULL,NULL),(2,1,'Sustainable intensification for a larger global rice bowl','https://doi.org/10.1038/s41467-021-27424-z',NULL,NULL,'2026-08-18 10:52:46','pending',NULL,NULL),(3,1,'Sustainable intensification for a larger global rice bowl','https://doi.org/10.1038/s41467-021-27424-z',NULL,NULL,'2026-08-18 10:52:47','pending',NULL,NULL);
/*!40000 ALTER TABLE `savedPapers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemSettings`
--

DROP TABLE IF EXISTS `systemSettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `systemSettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `systemSettings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemSettings`
--

LOCK TABLES `systemSettings` WRITE;
/*!40000 ALTER TABLE `systemSettings` DISABLE KEYS */;
INSERT INTO `systemSettings` VALUES (1,'siteTitle','Hello','2026-08-18 10:09:10');
/*!40000 ALTER TABLE `systemSettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uploadedFiles`
--

DROP TABLE IF EXISTS `uploadedFiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uploadedFiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `farmId` int DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `url` text NOT NULL,
  `fileKey` varchar(400) NOT NULL,
  `mimeType` varchar(100) DEFAULT NULL,
  `size` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewedBy` int DEFAULT NULL,
  `reviewedAt` timestamp NULL DEFAULT NULL,
  `reviewNote` text DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_uploads_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uploadedFiles`
--

LOCK TABLES `uploadedFiles` WRITE;
/*!40000 ALTER TABLE `uploadedFiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `uploadedFiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userProfiles`
--

DROP TABLE IF EXISTS `userProfiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userProfiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `userType` varchar(32) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `village` varchar(200) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `onboardingComplete` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fullName` varchar(200) DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `language` varchar(32) DEFAULT 'en',
  `farmingExperienceYears` int DEFAULT NULL,
  `farmOwnerStatus` varchar(50) DEFAULT NULL,
  `soilType` varchar(100) DEFAULT NULL,
  `rainfallType` varchar(50) DEFAULT NULL,
  `growingSeason` varchar(100) DEFAULT NULL,
  `irrigationAccess` varchar(50) DEFAULT NULL,
  `cropsOfInterest` json DEFAULT NULL,
  `regionTags` json DEFAULT NULL,
  `aboutMe` text DEFAULT NULL,
  `age` int DEFAULT NULL,
  `universityName` varchar(300) DEFAULT NULL,
  `enrollmentYear` int DEFAULT NULL,
  `degreeLevel` varchar(50) DEFAULT NULL,
  `courseName` varchar(300) DEFAULT NULL,
  `subjects` json DEFAULT NULL,
  `researchArea` varchar(300) DEFAULT NULL,
  `graduationYear` int DEFAULT NULL,
  `purpose` varchar(100) DEFAULT NULL,
  `onboardingAnswers` json DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_profile_userId` (`userId`),
  KEY `idx_profile_state` (`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userProfiles`
--

LOCK TABLES `userProfiles` WRITE;
/*!40000 ALTER TABLE `userProfiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `userProfiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) NOT NULL,
  `name` text DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `loginMethod` varchar(64) DEFAULT NULL,
  `role` enum('farmer','student','researcher','professional','business','admin','user') NOT NULL DEFAULT 'farmer',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `users_openId_unique` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=810001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'24WoQTGuR8pgkLuxftR8Ah','Ascovita Healthcare','ascovitahealthcare@gmail.com','google','admin','2026-08-18 00:12:44','2026-08-18 15:11:47','2026-08-18 15:11:47');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weatherCache`
--

DROP TABLE IF EXISTS `weatherCache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weatherCache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `locationKey` varchar(200) NOT NULL,
  `data` json DEFAULT NULL,
  `provider` varchar(50) DEFAULT NULL,
  `fetchedAt` timestamp NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `weatherCache_locationKey_unique` (`locationKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weatherCache`
--

LOCK TABLES `weatherCache` WRITE;
/*!40000 ALTER TABLE `weatherCache` DISABLE KEYS */;
INSERT INTO `weatherCache` VALUES (1,'26.847,80.946','{\"agri\": {\"heatStress\": false, \"humidityDiseaseRisk\": \"high\", \"irrigationAdvice\": \"No irrigation needed today — recent or expected rainfall likely sufficient.\", \"rainRisk\": \"high\", \"sprayingSuitability\": \"unsuitable\"}, \"current\": {\"description\": \"Moderate rain showers\", \"humidity\": 97, \"isDay\": true, \"rainProbability\": 91, \"temperature\": 25.1, \"windSpeed\": 4.5}, \"daily\": [{\"date\": \"2026-08-18\", \"humidity\": 99, \"rainProbability\": 95, \"rainfall\": 19.4, \"tempMax\": 30.5, \"tempMin\": 25, \"windSpeed\": 11.2}, {\"date\": \"2026-08-19\", \"humidity\": 99, \"rainProbability\": 71, \"rainfall\": 12.3, \"tempMax\": 32, \"tempMin\": 25.4, \"windSpeed\": 9.1}, {\"date\": \"2026-08-20\", \"humidity\": 97, \"rainProbability\": 79, \"rainfall\": 27.5, \"tempMax\": 31.8, \"tempMin\": 26.4, \"windSpeed\": 17.1}, {\"date\": \"2026-08-21\", \"humidity\": 100, \"rainProbability\": 67, \"rainfall\": 18.3, \"tempMax\": 31.6, \"tempMin\": 25.6, \"windSpeed\": 14.5}, {\"date\": \"2026-08-22\", \"humidity\": 97, \"rainProbability\": 78, \"rainfall\": 10.2, \"tempMax\": 32.7, \"tempMin\": 26.2, \"windSpeed\": 12.9}, {\"date\": \"2026-08-23\", \"humidity\": 96, \"rainProbability\": 82, \"rainfall\": 9.6, \"tempMax\": 30.1, \"tempMin\": 25.7, \"windSpeed\": 11}, {\"date\": \"2026-08-24\", \"humidity\": 100, \"rainProbability\": 86, \"rainfall\": 5.4, \"tempMax\": 32.1, \"tempMin\": 26, \"windSpeed\": 9.1}], \"freshness\": \"LIVE\", \"hourly\": [{\"rainProbability\": 91, \"temperature\": 27.1, \"time\": \"2026-08-18T00:00\"}, {\"rainProbability\": 93, \"temperature\": 26.9, \"time\": \"2026-08-18T01:00\"}, {\"rainProbability\": 94, \"temperature\": 25.7, \"time\": \"2026-08-18T02:00\"}, {\"rainProbability\": 95, \"temperature\": 25, \"time\": \"2026-08-18T03:00\"}, {\"rainProbability\": 94, \"temperature\": 25.1, \"time\": \"2026-08-18T04:00\"}, {\"rainProbability\": 94, \"temperature\": 25.1, \"time\": \"2026-08-18T05:00\"}, {\"rainProbability\": 93, \"temperature\": 25.3, \"time\": \"2026-08-18T06:00\"}, {\"rainProbability\": 93, \"temperature\": 26.1, \"time\": \"2026-08-18T07:00\"}, {\"rainProbability\": 92, \"temperature\": 27.6, \"time\": \"2026-08-18T08:00\"}, {\"rainProbability\": 91, \"temperature\": 28.6, \"time\": \"2026-08-18T09:00\"}, {\"rainProbability\": 91, \"temperature\": 29.3, \"time\": \"2026-08-18T10:00\"}, {\"rainProbability\": 90, \"temperature\": 30.5, \"time\": \"2026-08-18T11:00\"}, {\"rainProbability\": 90, \"temperature\": 30.5, \"time\": \"2026-08-18T12:00\"}, {\"rainProbability\": 89, \"temperature\": 27.6, \"time\": \"2026-08-18T13:00\"}, {\"rainProbability\": 86, \"temperature\": 27.8, \"time\": \"2026-08-18T14:00\"}, {\"rainProbability\": 78, \"temperature\": 28.8, \"time\": \"2026-08-18T15:00\"}, {\"rainProbability\": 67, \"temperature\": 29.5, \"time\": \"2026-08-18T16:00\"}, {\"rainProbability\": 55, \"temperature\": 29.2, \"time\": \"2026-08-18T17:00\"}, {\"rainProbability\": 42, \"temperature\": 28.4, \"time\": \"2026-08-18T18:00\"}, {\"rainProbability\": 29, \"temperature\": 27.9, \"time\": \"2026-08-18T19:00\"}, {\"rainProbability\": 20, \"temperature\": 27.8, \"time\": \"2026-08-18T20:00\"}, {\"rainProbability\": 17, \"temperature\": 27.4, \"time\": \"2026-08-18T21:00\"}, {\"rainProbability\": 17, \"temperature\": 27.1, \"time\": \"2026-08-18T22:00\"}, {\"rainProbability\": 18, \"temperature\": 26.7, \"time\": \"2026-08-18T23:00\"}], \"location\": {\"district\": \"Lucknow\", \"lat\": 26.8467, \"lon\": 80.9462, \"state\": \"Uttar Pradesh\"}, \"provider\": \"Open-Meteo\", \"retrievedAt\": \"2026-08-18T00:26:49.882Z\", \"retrievedFrom\": \"api\"}','Open-Meteo','2026-08-18 00:26:50');
/*!40000 ALTER TABLE `weatherCache` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-18 15:15:03
