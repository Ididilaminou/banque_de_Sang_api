-- CreateTable
CREATE TABLE `demandes_sang` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `etablissementDemandeurId` INTEGER NOT NULL,
    `etablissementDestinataireId` INTEGER NULL,
    `produit` ENUM('SANG_TOTAL', 'GLOBULES_ROUGES', 'PLAQUETTES', 'PLASMA') NOT NULL,
    `groupeSanguin` ENUM('A', 'B', 'AB', 'O') NOT NULL,
    `rhesus` ENUM('POSITIF', 'NEGATIF') NOT NULL,
    `quantite` INTEGER NOT NULL,
    `urgence` BOOLEAN NOT NULL DEFAULT false,
    `motif` VARCHAR(500) NOT NULL,
    `statut` ENUM('EN_ATTENTE', 'EN_COURS', 'ACCEPTEE', 'REJETEE', 'LIVREE', 'ANNULEE') NOT NULL DEFAULT 'EN_ATTENTE',
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    INDEX `demandes_sang_statut_urgence_idx`(`statut`, `urgence`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `demandes_sang` ADD CONSTRAINT `demandes_sang_etablissementDemandeurId_fkey` FOREIGN KEY (`etablissementDemandeurId`) REFERENCES `etablissements`(`identifiant`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demandes_sang` ADD CONSTRAINT `demandes_sang_etablissementDestinataireId_fkey` FOREIGN KEY (`etablissementDestinataireId`) REFERENCES `etablissements`(`identifiant`) ON DELETE SET NULL ON UPDATE CASCADE;
