-- CreateTable
CREATE TABLE `activations_comptes` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateurIdentifiant` INTEGER NOT NULL,
    `codeHash` VARCHAR(64) NOT NULL,
    `dateExpiration` DATETIME(3) NOT NULL,
    `estUtilise` BOOLEAN NOT NULL DEFAULT false,
    `dateUtilisation` DATETIME(3) NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `activations_comptes_utilisateurIdentifiant_key`(`utilisateurIdentifiant`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `activations_comptes` ADD CONSTRAINT `activations_comptes_utilisateurIdentifiant_fkey` FOREIGN KEY (`utilisateurIdentifiant`) REFERENCES `utilisateurs`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;
