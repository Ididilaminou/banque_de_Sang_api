-- CreateTable
CREATE TABLE `recommandations_donneurs` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `demandeSangIdentifiant` INTEGER NOT NULL,
    `donneurIdentifiant` INTEGER NOT NULL,
    `statut` ENUM('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE') NOT NULL DEFAULT 'EN_ATTENTE',
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateReponse` DATETIME(3) NULL,

    INDEX `recommandations_donneurs_donneurIdentifiant_statut_idx`(`donneurIdentifiant`, `statut`),
    UNIQUE INDEX `recommandations_donneurs_demandeSangIdentifiant_donneurIdent_key`(`demandeSangIdentifiant`, `donneurIdentifiant`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recommandations_donneurs` ADD CONSTRAINT `recommandations_donneurs_demandeSangIdentifiant_fkey` FOREIGN KEY (`demandeSangIdentifiant`) REFERENCES `demandes_sang`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommandations_donneurs` ADD CONSTRAINT `recommandations_donneurs_donneurIdentifiant_fkey` FOREIGN KEY (`donneurIdentifiant`) REFERENCES `donneurs`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;
