-- Script to insert a MASSIVE amount of mock data for testing
DO $$
DECLARE
    v_company_id UUID := 'c23f7a10-e4b1-428b-af2c-13c21a5016c8';
    v_client_id UUID;
    v_vehicle_id UUID;
    v_deviz_id UUID;
    v_part_id UUID;
    
    v_loop_client INT;
    v_loop_vehicle INT;
    v_loop_deviz INT;
    v_loop_part INT;
    v_qty INT;
    v_hours NUMERIC;
    v_price_per_hour NUMERIC;

    -- Arrays to pick random data from
    v_branduri_piese TEXT[] := ARRAY['Bosch', 'Mann', 'Brembo', 'Castrol', 'Motul', 'TRW', 'ATE', 'Valeo', 'Hella', 'Luk'];
    v_categorii_piese TEXT[] := ARRAY['Filtre', 'Sistem Franare', 'Uleiuri', 'Distributie', 'Electrice', 'Suspensie', 'Directie'];
    v_nume_clienti TEXT[] := ARRAY['Ion Popescu', 'Maria Ionescu', 'SC Auto Fleet SRL', 'Andrei Radu', 'SC Delivery Express SRL', 'George Vasilescu', 'Elena Marin', 'SC Transport Local SA', 'Mihai Dobre', 'Alexandru Stan', 'SC Logistic Pro SRL', 'Cristian Munteanu', 'Ioana Vasile', 'SC Curierat Rapid SRL', 'Dumitru Iancu', 'Vasile Geamasiu', 'Ana Maria', 'Bogdan Iorga', 'Stefan cel Mare', 'Dan Diaconescu'];
    v_marci_auto TEXT[] := ARRAY['Volkswagen', 'BMW', 'Ford', 'Dacia', 'Renault', 'Skoda', 'Audi', 'Mercedes-Benz', 'Toyota', 'Honda', 'Hyundai', 'Kia', 'Volvo'];
    v_modele_auto TEXT[] := ARRAY['Golf', 'Seria 3', 'Focus', 'Logan', 'Megane', 'Octavia', 'A4', 'C-Class', 'Corolla', 'Civic', 'Tucson', 'Sportage', 'XC60'];
    v_culori TEXT[] := ARRAY['Albastru', 'Negru', 'Alb', 'Rosu', 'Gri', 'Argintiu', 'Verde', 'Galben'];
    
    v_part_ids UUID[] := ARRAY[]::UUID[];
    v_rand_idx INT;
    v_rand_part_idx INT;
BEGIN
    -- 1. Generate 30 New Parts
    FOR v_loop_part IN 1..30 LOOP
        v_part_id := gen_random_uuid();
        v_part_ids := array_append(v_part_ids, v_part_id);
        
        INSERT INTO parts_inventory (id, company_id, cod_piesa, nume_piesa, brand, categorie, stoc, pret_unitar, furnizor, is_active)
        VALUES (
            v_part_id, 
            v_company_id, 
            'P-' || lpad(floor(random() * 10000)::TEXT, 4, '0'), 
            'Piesa Auto Generica ' || v_loop_part, 
            v_branduri_piese[floor(random() * array_length(v_branduri_piese, 1) + 1)], 
            v_categorii_piese[floor(random() * array_length(v_categorii_piese, 1) + 1)], 
            floor(random() * 100 + 10)::INT, 
            (random() * 400 + 20)::NUMERIC(10,2), 
            'Furnizor ' || floor(random() * 5 + 1)::TEXT, 
            true
        );
    END LOOP;

    -- 2. Generate 25 Clients
    FOR v_loop_client IN 1..25 LOOP
        v_client_id := gen_random_uuid();
        v_rand_idx := floor(random() * array_length(v_nume_clienti, 1) + 1);
        
        INSERT INTO clients (id, company_id, nume, cui_cnp, locatie, strada, telefon)
        VALUES (
            v_client_id, 
            v_company_id, 
            v_nume_clienti[v_rand_idx] || ' ' || floor(random() * 100)::TEXT, 
            'RO' || floor(random() * 80000000 + 10000000)::TEXT, 
            'Oras ' || floor(random() * 10 + 1)::TEXT, 
            'Strada ' || floor(random() * 100 + 1)::TEXT, 
            '07' || floor(random() * 80000000 + 10000000)::TEXT
        );

        -- 3. For each client, generate 2 to 4 vehicles
        FOR v_loop_vehicle IN 1..(floor(random() * 3 + 2)::INT) LOOP
            v_vehicle_id := gen_random_uuid();
            v_rand_idx := floor(random() * array_length(v_marci_auto, 1) + 1);
            
            INSERT INTO vehicles (id, company_id, client_id, numar_inmatriculare, marca, model, seria_sasiu, an_fabricatie, culoare, capacitate_cilindrica)
            VALUES (
                v_vehicle_id, 
                v_company_id, 
                v_client_id, 
                CHR((floor(random() * 26) + 65)::INT)::TEXT || CHR((floor(random() * 26) + 65)::INT)::TEXT || '-' || floor(random() * 90 + 10)::TEXT || '-' || CHR((floor(random() * 26) + 65)::INT) || CHR((floor(random() * 26) + 65)::INT) || CHR((floor(random() * 26) + 65)::INT), 
                v_marci_auto[v_rand_idx], 
                v_modele_auto[v_rand_idx], 
                'WBA' || floor(random() * 100000000000000)::TEXT, 
                (floor(random() * 15 + 2005))::TEXT, 
                v_culori[floor(random() * array_length(v_culori, 1) + 1)], 
                (floor(random() * 1500 + 900))::TEXT
            );

            -- 4. For each vehicle, generate 5 to 10 devize !
            FOR v_loop_deviz IN 1..(floor(random() * 6 + 5)::INT) LOOP
                v_deviz_id := gen_random_uuid();
                
                -- Insert deviz basic header
                INSERT INTO devize (id, company_id, client_id, vehicle_id, series, km_intrare, nivel_carburant, motiv_intrare, observatii, data_intrare, data_iesire, is_finalizat)
                VALUES (
                    v_deviz_id, 
                    v_company_id, 
                    v_client_id, 
                    v_vehicle_id, 
                    lpad(floor(random() * 999999)::TEXT, 6, '0'), 
                    (floor(random() * 250000 + 10000))::TEXT, 
                    (floor(random() * 4 + 1)::TEXT || '/4'), 
                    'Interventie mecanica #' || floor(random() * 1000)::TEXT, 
                    'Date generate automat pentru testare intensiva', 
                    NOW() - (random() * 500 || ' days')::INTERVAL,
                    CASE WHEN random() > 0.3 THEN NOW() - (random() * 400 || ' days')::INTERVAL ELSE NULL END,
                    random() > 0.3 -- 70% chance of being finalized (closed)
                );

                -- Insert 2 to 5 parts for this deviz
                FOR v_loop_part IN 1..(floor(random() * 4 + 2)::INT) LOOP
                    v_rand_part_idx := floor(random() * array_length(v_part_ids, 1) + 1);
                    v_qty := floor(random() * 3 + 1)::INT;
                    
                    INSERT INTO deviz_parts (deviz_id, inventory_part_id, cod_piesa, nume_piesa, stare, cantitate, pret_unitar, discount_percentage, total)
                    SELECT 
                        v_deviz_id, 
                        id, 
                        cod_piesa, 
                        nume_piesa, 
                        'nou', 
                        v_qty,
                        pret_unitar,
                        0,
                        (pret_unitar * v_qty)
                    FROM parts_inventory 
                    WHERE id = v_part_ids[v_rand_part_idx];
                END LOOP;

                -- Insert 1 to 4 labor entries for this deviz
                FOR v_loop_part IN 1..(floor(random() * 4 + 1)::INT) LOOP
                    v_hours := (random() * 3 + 0.5)::NUMERIC(10,1);
                    v_price_per_hour := (random() * 100 + 80)::NUMERIC(10,2);
                    
                    INSERT INTO deviz_labor (deviz_id, operatiune, durata, pret_orar, discount_percentage, total)
                    VALUES (
                        v_deviz_id, 
                        'Manopera Operatiunea ' || floor(random() * 50)::TEXT, 
                        v_hours::TEXT, 
                        v_price_per_hour, 
                        0, 
                        (v_price_per_hour * v_hours)
                    );
                END LOOP;

                -- Update the total cache inside the deviz (similar to how triggers normally would or UI)
                UPDATE devize 
                SET 
                    total_piese = (SELECT COALESCE(SUM(total), 0) FROM deviz_parts WHERE deviz_id = v_deviz_id),
                    total_manopera = (SELECT COALESCE(SUM(total), 0) FROM deviz_labor WHERE deviz_id = v_deviz_id),
                    total_deviz = (SELECT COALESCE(SUM(total), 0) FROM deviz_parts WHERE deviz_id = v_deviz_id) + (SELECT COALESCE(SUM(total), 0) FROM deviz_labor WHERE deviz_id = v_deviz_id)
                WHERE id = v_deviz_id;

            END LOOP;
        END LOOP;
    END LOOP;

END $$;
