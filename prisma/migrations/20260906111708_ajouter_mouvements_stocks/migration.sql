-- CreateTable
CREATE TABLE `mouvements_stocks` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `stockIdentifiant` INTEGER NOT NULL,
    `utilisateurIdentifiant` INTEGER NOT NULL,
    `type` ENUM('ENTREE', 'SORTIE', 'AJUSTEMENT') NOT NULL,
    `ancienneQuantite` INTEGER NOT NULL,
    `nouvelleQuantite` INTEGER NOT NULL,
    `commentaire` VARCHAR(500) NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mouvements_stocks_stockIdentifiant_dateCreation_idx`(`stockIdentifiant`, `dateCreation`),
    INDEX `mouvements_stocks_utilisateurIdentifiant_dateCreation_idx`(`utilisateurIdentifiant`, `dateCreation`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mouvements_stocks` ADD CONSTRAINT `mouvements_stocks_stockIdentifiant_fkey` FOREIGN KEY (`stockIdentifiant`) REFERENCES `stocks`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvements_stocks` ADD CONSTRAINT `mouvements_stocks_utilisateurIdentifiant_fkey` FOREIGN KEY (`utilisateurIdentifiant`) REFERENCES `utilisateurs`(`identifiant`) ON DELETE RESTRICT ON UPDATE CASCADE;
