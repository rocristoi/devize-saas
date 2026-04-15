
-- Se pare că utilizatorii 'anon' și 'authenticated' nu au drepturi efective pe structura tabelei.
-- GRANT-urile de mai jos repară eroarea 'permission denied for table upload_sessions'
GRANT ALL PRIVILEGES ON TABLE upload_sessions TO postgres, anon, authenticated, service_role;
