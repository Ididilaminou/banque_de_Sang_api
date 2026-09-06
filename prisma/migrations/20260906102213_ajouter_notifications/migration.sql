-- CreateTable
CREATE TABLE `notifications` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateurIdentifiant` INTEGER NOT NULL,
    `demandeSangIdentifiant` INTEGER NULL,
    `type` VARCHAR(60) NOT NULL,
    `titre` VARCHAR(150) NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `estLue` BOOLEAN NOT NULL DEFAULT false,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateLecture` DATETIME(3) NULL,

    INDEX `notifications_utilisateurIdentifiant_estLue_dateCreation_idx`(`utilisateurIdentifiant`, `estLue`, `dateCreation`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_utilisateurIdentifiant_fkey` FOREIGN KEY (`utilisateurIdentifiant`) REFERENCES `utilisateurs`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_demandeSangIdentifiant_fkey` FOREIGN KEY (`demandeSangIdentifiant`) REFERENCES `demandes_sang`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;
