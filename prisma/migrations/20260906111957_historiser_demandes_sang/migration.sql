-- CreateTable
CREATE TABLE `historiques_demandes_sang` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `demandeSangIdentifiant` INTEGER NOT NULL,
    `utilisateurIdentifiant` INTEGER NOT NULL,
    `ancienStatut` ENUM('EN_ATTENTE', 'EN_COURS', 'ACCEPTEE', 'REJETEE', 'LIVREE', 'ANNULEE') NOT NULL,
    `nouveauStatut` ENUM('EN_ATTENTE', 'EN_COURS', 'ACCEPTEE', 'REJETEE', 'LIVREE', 'ANNULEE') NOT NULL,
    `commentaire` VARCHAR(500) NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historiques_demandes_sang_demandeSangIdentifiant_dateCreatio_idx`(`demandeSangIdentifiant`, `dateCreation`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `historiques_demandes_sang` ADD CONSTRAINT `historiques_demandes_sang_demandeSangIdentifiant_fkey` FOREIGN KEY (`demandeSangIdentifiant`) REFERENCES `demandes_sang`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historiques_demandes_sang` ADD CONSTRAINT `historiques_demandes_sang_utilisateurIdentifiant_fkey` FOREIGN KEY (`utilisateurIdentifiant`) REFERENCES `utilisateurs`(`identifiant`) ON DELETE RESTRICT ON UPDATE CASCADE;
