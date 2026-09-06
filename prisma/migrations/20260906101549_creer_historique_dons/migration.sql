-- CreateTable
CREATE TABLE `dons` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `donneurIdentifiant` INTEGER NOT NULL,
    `dateDon` DATETIME(3) NOT NULL,
    `volumeMillilitres` INTEGER NOT NULL,
    `statut` ENUM('ENREGISTRE', 'VALIDE', 'ANNULE') NOT NULL DEFAULT 'ENREGISTRE',
    `commentaire` VARCHAR(500) NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    INDEX `dons_donneurIdentifiant_dateDon_idx`(`donneurIdentifiant`, `dateDon`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dons` ADD CONSTRAINT `dons_donneurIdentifiant_fkey` FOREIGN KEY (`donneurIdentifiant`) REFERENCES `donneurs`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;
