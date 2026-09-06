-- CreateTable
CREATE TABLE `dossiers_donneurs` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `donneurIdentifiant` INTEGER NOT NULL,
    `statut` VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    `notes` TEXT NULL,
    `dateOuverture` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dossiers_donneurs_donneurIdentifiant_key`(`donneurIdentifiant`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dossiers_personnels` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateurIdentifiant` INTEGER NOT NULL,
    `statut` VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    `notes` TEXT NULL,
    `dateOuverture` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dossiers_personnels_utilisateurIdentifiant_key`(`utilisateurIdentifiant`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dossiers_etablissements` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `etablissementIdentifiant` INTEGER NOT NULL,
    `statut` VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    `notes` TEXT NULL,
    `dateOuverture` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dossiers_etablissements_etablissementIdentifiant_key`(`etablissementIdentifiant`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dossiers_administrateurs` (
    `identifiant` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateurIdentifiant` INTEGER NOT NULL,
    `statut` VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    `notes` TEXT NULL,
    `dateOuverture` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dossiers_administrateurs_utilisateurIdentifiant_key`(`utilisateurIdentifiant`),
    PRIMARY KEY (`identifiant`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dossiers_donneurs` ADD CONSTRAINT `dossiers_donneurs_donneurIdentifiant_fkey` FOREIGN KEY (`donneurIdentifiant`) REFERENCES `donneurs`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dossiers_personnels` ADD CONSTRAINT `dossiers_personnels_utilisateurIdentifiant_fkey` FOREIGN KEY (`utilisateurIdentifiant`) REFERENCES `utilisateurs`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dossiers_etablissements` ADD CONSTRAINT `dossiers_etablissements_etablissementIdentifiant_fkey` FOREIGN KEY (`etablissementIdentifiant`) REFERENCES `etablissements`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dossiers_administrateurs` ADD CONSTRAINT `dossiers_administrateurs_utilisateurIdentifiant_fkey` FOREIGN KEY (`utilisateurIdentifiant`) REFERENCES `utilisateurs`(`identifiant`) ON DELETE CASCADE ON UPDATE CASCADE;
