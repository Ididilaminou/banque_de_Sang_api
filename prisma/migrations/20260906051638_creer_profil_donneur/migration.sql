-- CreateTable
CREATE TABLE `donneurs` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateurIdentifiant` INTEGER NOT NULL,
    `groupeSanguin` ENUM('A', 'B', 'AB', 'O') NOT NULL,
    `rhesus` ENUM('POSITIF', 'NEGATIF') NOT NULL,
    `estDisponible` BOOLEAN NOT NULL DEFAULT false,
    `dateDerniereDisponibilite` DATETIME(3) NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    UNIQUE INDEX `donneurs_utilisateurIdentifiant_key`(`utilisateurIdentifiant`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `donneurs` ADD CONSTRAINT `donneurs_utilisateurIdentifiant_fkey` FOREIGN KEY (`utilisateurIdentifiant`) REFERENCES `utilisateurs`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;
