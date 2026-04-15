-- Make cui_cif nullable — it is optional for sole traders / unregistered services.

ALTER TABLE companies
  ALTER COLUMN cui_cif DROP NOT NULL;
