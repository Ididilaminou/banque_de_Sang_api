-- CreateTable
CREATE TABLE `tests_eligibilite` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `donneurIdentifiant` INTEGER NOT NULL,
    `age` INTEGER NOT NULL,
    `poidsKg` DOUBLE NOT NULL,
    `fievreRecente` BOOLEAN NOT NULL,
    `maladieEnCours` BOOLEAN NOT NULL,
    `prendAntibiotiques` BOOLEAN NOT NULL,
    `grossesseOuAllaitement` BOOLEAN NOT NULL,
    `tatouageRecent` BOOLEAN NOT NULL,
    `transfusionRecente` BOOLEAN NOT NULL,
    `dernierDonDate` DATETIME(3) NULL,
    `resultat` ENUM('ELIGIBLE', 'NON_ELIGIBLE', 'A_VALIDER') NOT NULL,
    `motif` VARCHAR(500) NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tests_eligibilite_donneurIdentifiant_dateCreation_idx`(`donneurIdentifiant`, `dateCreation`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tests_eligibilite` ADD CONSTRAINT `tests_eligibilite_donneurIdentifiant_fkey` FOREIGN KEY (`donneurIdentifiant`) REFERENCES `donneurs`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;
