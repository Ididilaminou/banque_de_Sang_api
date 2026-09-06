/*
  Warnings:

  - Added the required column `infectionRecente` to the `tests_eligibilite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operationRecente` to the `tests_eligibilite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vaccinationRecente` to the `tests_eligibilite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voyageRecent` to the `tests_eligibilite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tests_eligibilite` ADD COLUMN `analyseIa` TEXT NULL,
    ADD COLUMN `infectionRecente` BOOLEAN NOT NULL,
    ADD COLUMN `operationRecente` BOOLEAN NOT NULL,
    ADD COLUMN `recommandations` TEXT NULL,
    ADD COLUMN `vaccinationRecente` BOOLEAN NOT NULL,
    ADD COLUMN `validationProfessionnel` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `voyageRecent` BOOLEAN NOT NULL;
