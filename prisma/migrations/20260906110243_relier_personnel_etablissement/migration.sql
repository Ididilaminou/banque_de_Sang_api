-- AlterTable
ALTER TABLE `utilisateurs` ADD COLUMN `etablissementIdentifiant` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_etablissementIdentifiant_fkey` FOREIGN KEY (`etablissementIdentifiant`) REFERENCES `etablissements`(`identifiant`) ON DELETE SET NULL ON UPDATE CASCADE;
