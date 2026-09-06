-- CreateTable
CREATE TABLE `etablissements` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(150) NOT NULL,
    `type` ENUM('BANQUE_SANG', 'HOPITAL') NOT NULL,
    `adresse` VARCHAR(255) NOT NULL,
    `ville` VARCHAR(100) NOT NULL,
    `telephone` VARCHAR(30) NULL,
    `courriel` VARCHAR(255) NOT NULL,
    `statut` ENUM('EN_ATTENTE', 'AUTORISE', 'SUSPENDU') NOT NULL DEFAULT 'EN_ATTENTE',
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    UNIQUE INDEX `etablissements_courriel_key`(`courriel`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
