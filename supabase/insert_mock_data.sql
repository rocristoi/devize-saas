-- Script to insert mock data for testing
DO $$
DECLARE
    v_company_id UUID := 'c23f7a10-e4b1-428b-af2c-13c21a5016c8';
    
    -- Client IDs
    v_client_1 UUID := gen_random_uuid();
    v_client_2 UUID := gen_random_uuid();
    v_client_3 UUID := gen_random_uuid();
    v_client_4 UUID := gen_random_uuid();
    v_client_5 UUID := gen_random_uuid();

    -- Vehicle IDs
    v_vehicle_1_1 UUID := gen_random_uuid();
    v_vehicle_1_2 UUID := gen_random_uuid();
    v_vehicle_2_1 UUID := gen_random_uuid();
    v_vehicle_3_1 UUID := gen_random_uuid();
    v_vehicle_4_1 UUID := gen_random_uuid();
    v_vehicle_5_1 UUID := gen_random_uuid();

    -- Parts IDs
    v_part_1 UUID := gen_random_uuid();
    v_part_2 UUID := gen_random_uuid();
    v_part_3 UUID := gen_random_uuid();
    v_part_4 UUID := gen_random_uuid();
    v_part_5 UUID := gen_random_uuid();

    -- Deviz IDs
    v_deviz_1 UUID := gen_random_uuid();
    v_deviz_2 UUID := gen_random_uuid();
    v_deviz_3 UUID := gen_random_uuid();
    v_deviz_4 UUID := gen_random_uuid();
    v_deviz_5 UUID := gen_random_uuid();

BEGIN
    -- 1. Insert Parts Inventory
    INSERT INTO parts_inventory (id, company_id, cod_piesa, nume_piesa, brand, categorie, stoc, pret_unitar, furnizor, is_active) VALUES
    (v_part_1, v_company_id, 'OE-101', 'Filtru Ulei', 'Bosch', 'Filtre', 50, 45.00, 'Autonet', true),
    (v_part_2, v_company_id, 'OE-102', 'Filtru Aer', 'Mann', 'Filtre', 40, 65.00, 'Autonet', true),
    (v_part_3, v_company_id, 'BR-201', 'Placute Frana Fata', 'Brembo', 'Sistem Franare', 20, 250.00, 'Unix', true),
    (v_part_4, v_company_id, 'BR-202', 'Discuri Frana Fata', 'Brembo', 'Sistem Franare', 15, 450.00, 'Unix', true),
    (v_part_5, v_company_id, 'OL-5W30', 'Ulei Motor 5W30 5L', 'Castrol', 'Uleiuri', 30, 220.00, 'Tiriac Auto', true);

    -- 2. Insert Clients
    INSERT INTO clients (id, company_id, nume, cui_cnp, locatie, strada, telefon) VALUES
    (v_client_1, v_company_id, 'Ion Popescu', '1800101123456', 'Bucuresti', 'Str. Primaverii 12', '0722123456'),
    (v_client_2, v_company_id, 'Maria Ionescu', '2850202123456', 'Cluj Napoca', 'Str. Memorandumului 5', '0733123456'),
    (v_client_3, v_company_id, 'SC Auto Fleet SRL', 'RO12345678', 'Timisoara', 'Blv. Republicii 10', '0744123456'),
    (v_client_4, v_company_id, 'Andrei Radu', '1900303123456', 'Iasi', 'Str. Pacurari 40', '0755123456'),
    (v_client_5, v_company_id, 'SC Delivery Express SRL', 'RO87654321', 'Brasov', 'Calea Bucuresti 100', '0766123456');

    -- 3. Insert Vehicles
    INSERT INTO vehicles (id, company_id, client_id, numar_inmatriculare, marca, model, seria_sasiu, an_fabricatie, culoare, capacitate_cilindrica) VALUES
    (v_vehicle_1_1, v_company_id, v_client_1, 'B-10-ABC', 'Volkswagen', 'Golf 7', 'WVWZZZAUZ12345678', '2015', 'Albastru', '1598'),
    (v_vehicle_1_2, v_company_id, v_client_1, 'B-20-DEF', 'Volkswagen', 'Passat B8', 'WVWZZZ3CZ12345678', '2018', 'Negru', '1968'),
    (v_vehicle_2_1, v_company_id, v_client_2, 'CJ-15-XYZ', 'BMW', 'Seria 3 F30', 'WBA31234567890123', '2014', 'Alb', '1995'),
    (v_vehicle_3_1, v_company_id, v_client_3, 'TM-99-FLT', 'Ford', 'Transit', 'WF012345678901234', '2020', 'Alb', '1995'),
    (v_vehicle_4_1, v_company_id, v_client_4, 'IS-05-TST', 'Dacia', 'Logan', 'UU112345678901234', '2019', 'Rosu', '999'),
    (v_vehicle_5_1, v_company_id, v_client_5, 'BV-50-DLV', 'Renault', 'Master', 'VF112345678901234', '2021', 'Alb', '2298');

    -- 4. Insert Devize
    
    -- Deviz 1: Revizie Vw Golf (Client 1)
    INSERT INTO devize (id, company_id, client_id, vehicle_id, series, km_intrare, nivel_carburant, motiv_intrare, observatii, data_intrare, total_piese, total_manopera, total_deviz, is_finalizat) VALUES
    (v_deviz_1, v_company_id, v_client_1, v_vehicle_1_1, '000001', '125000', '1/2', 'Revizie periodica', 'Masina a venit cu o zgarietura pe aripa stanga', NOW() - INTERVAL '5 days', 330.00, 200.00, 530.00, true);

    INSERT INTO deviz_parts (deviz_id, inventory_part_id, cod_piesa, nume_piesa, stare, cantitate, pret_unitar, discount_percentage, total) VALUES
    (v_deviz_1, v_part_1, 'OE-101', 'Filtru Ulei', 'nou', 1, 45.00, 0, 45.00),
    (v_deviz_1, v_part_2, 'OE-102', 'Filtru Aer', 'nou', 1, 65.00, 0, 65.00),
    (v_deviz_1, v_part_5, 'OL-5W30', 'Ulei Motor 5W30 5L', 'nou', 1, 220.00, 0, 220.00);

    INSERT INTO deviz_labor (deviz_id, operatiune, durata, pret_orar, discount_percentage, total) VALUES
    (v_deviz_1, 'Inlocuire ulei si filtre', '2', 100.00, 0, 200.00);

    -- Deviz 2: Frane BMW (Client 2)
    INSERT INTO devize (id, company_id, client_id, vehicle_id, series, km_intrare, nivel_carburant, motiv_intrare, observatii, data_intrare, total_piese, total_manopera, total_deviz, is_finalizat) VALUES
    (v_deviz_2, v_company_id, v_client_2, v_vehicle_2_1, '000002', '180500', '1/4', 'Zgomot la franare', 'Placute fata uzate complet', NOW() - INTERVAL '2 days', 1150.00, 300.00, 1450.00, false);

    INSERT INTO deviz_parts (deviz_id, inventory_part_id, cod_piesa, nume_piesa, stare, cantitate, pret_unitar, discount_percentage, total) VALUES
    (v_deviz_2, v_part_3, 'BR-201', 'Placute Frana Fata', 'nou', 1, 250.00, 0, 250.00),
    (v_deviz_2, v_part_4, 'BR-202', 'Discuri Frana Fata', 'nou', 2, 450.00, 0, 900.00);

    INSERT INTO deviz_labor (deviz_id, operatiune, durata, pret_orar, discount_percentage, total) VALUES
    (v_deviz_2, 'Inlocuire discuri si placute frana fata', '2', 150.00, 0, 300.00);
    
    -- Deviz 3: Diagnoza Dacia (Client 4)
    INSERT INTO devize (id, company_id, client_id, vehicle_id, series, km_intrare, nivel_carburant, motiv_intrare, observatii, data_intrare, total_piese, total_manopera, total_deviz, is_finalizat) VALUES
    (v_deviz_3, v_company_id, v_client_4, v_vehicle_4_1, '000003', '65000', 'Full', 'Martor motor aprins', 'Verificare coduri eroare', NOW() - INTERVAL '1 days', 0.00, 150.00, 150.00, true);

    INSERT INTO deviz_labor (deviz_id, operatiune, durata, pret_orar, discount_percentage, total) VALUES
    (v_deviz_3, 'Diagnoza computerizata', '1', 150.00, 0, 150.00);

    -- Deviz 4: Revizie Fleet Ford (Client 3)
    INSERT INTO devize (id, company_id, client_id, vehicle_id, series, km_intrare, nivel_carburant, motiv_intrare, observatii, data_intrare, data_iesire, total_piese, total_manopera, total_deviz, is_finalizat) VALUES
    (v_deviz_4, v_company_id, v_client_3, v_vehicle_3_1, '000004', '210000', '3/4', 'Revizie periodica flota', 'Urgent', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 330.00, 200.00, 530.00, true);

    INSERT INTO deviz_parts (deviz_id, inventory_part_id, cod_piesa, nume_piesa, stare, cantitate, pret_unitar, discount_percentage, total) VALUES
    (v_deviz_4, v_part_1, 'OE-101', 'Filtru Ulei', 'nou', 1, 45.00, 0, 45.00),
    (v_deviz_4, v_part_2, 'OE-102', 'Filtru Aer', 'nou', 1, 65.00, 0, 65.00),
    (v_deviz_4, v_part_5, 'OL-5W30', 'Ulei Motor 5W30 5L', 'nou', 1, 220.00, 0, 220.00);

    INSERT INTO deviz_labor (deviz_id, operatiune, durata, pret_orar, discount_percentage, total) VALUES
    (v_deviz_4, 'Inlocuire ulei si filtre', '2', 100.00, 0, 200.00);

    -- Deviz 5: VW Passat - Client 1
    INSERT INTO devize (id, company_id, client_id, vehicle_id, series, km_intrare, nivel_carburant, motiv_intrare, observatii, data_intrare, total_piese, total_manopera, total_deviz, is_finalizat) VALUES
    (v_deviz_5, v_company_id, v_client_1, v_vehicle_1_2, '000005', '140000', 'Empty', 'Inlocuire placute', '', NOW(), 250.00, 100.00, 350.00, false);
    
    INSERT INTO deviz_parts (deviz_id, inventory_part_id, cod_piesa, nume_piesa, stare, cantitate, pret_unitar, discount_percentage, total) VALUES
    (v_deviz_5, v_part_3, 'BR-201', 'Placute Frana Fata', 'nou', 1, 250.00, 0, 250.00);

    INSERT INTO deviz_labor (deviz_id, operatiune, durata, pret_orar, discount_percentage, total) VALUES
    (v_deviz_5, 'Inlocuire placute frana', '1', 100.00, 0, 100.00);

END $$;
