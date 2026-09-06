-- CreateTable
CREATE TABLE `journaux_audit` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateurIdentifiant` INTEGER NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `ressource` VARCHAR(80) NOT NULL,
    `ressourceIdentifiant` INTEGER NULL,
    `details` TEXT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `journaux_audit_ressource_ressourceIdentifiant_dateCreation_idx`(`ressource`, `ressourceIdentifiant`, `dateCreation`),
    INDEX `journaux_audit_utilisateurIdentifiant_dateCreation_idx`(`utilisateurIdentifiant`, `dateCreation`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `journaux_audit` ADD CONSTRAINT `journaux_audit_utilisateurIdentifiant_fkey` FOREIGN KEY (`utilisateurIdentifiant`) REFERENCES `utilisateurs`(`identifiant`) ON DELETE RESTRICT ON UPDATE CASCADE;
