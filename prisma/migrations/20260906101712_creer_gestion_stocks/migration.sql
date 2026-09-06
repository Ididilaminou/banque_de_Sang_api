-- CreateTable
CREATE TABLE `stocks` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `etablissementIdentifiant` INTEGER NOT NULL,
    `produit` ENUM('SANG_TOTAL', 'GLOBULES_ROUGES', 'PLAQUETTES', 'PLASMA') NOT NULL,
    `groupeSanguin` ENUM('A', 'B', 'AB', 'O') NOT NULL,
    `rhesus` ENUM('POSITIF', 'NEGATIF') NOT NULL,
    `quantite` INTEGER NOT NULL DEFAULT 0,
    `seuilAlerte` INTEGER NOT NULL DEFAULT 5,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    INDEX `stocks_groupeSanguin_rhesus_produit_idx`(`groupeSanguin`, `rhesus`, `produit`),
    UNIQUE INDEX `stocks_etablissementIdentifiant_produit_groupeSanguin_rhesus_key`(`etablissementIdentifiant`, `produit`, `groupeSanguin`, `rhesus`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stocks` ADD CONSTRAINT `stocks_etablissementIdentifiant_fkey` FOREIGN KEY (`etablissementIdentifiant`) REFERENCES `etablissements`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;
