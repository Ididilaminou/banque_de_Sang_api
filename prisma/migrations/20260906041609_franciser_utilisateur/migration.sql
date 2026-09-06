/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `utilisateurs` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `courriel` VARCHAR(255) NOT NULL,
    `motDePasseHash` VARCHAR(255) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `telephone` VARCHAR(30) NULL,
    `role` ENUM('DONNEUR', 'PERSONNEL_BANQUE', 'PERSONNEL_HOPITAL', 'ADMINISTRATEUR') NOT NULL DEFAULT 'DONNEUR',
    `estActif` BOOLEAN NOT NULL DEFAULT true,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    UNIQUE INDEX `utilisateurs_courriel_key`(`courriel`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
