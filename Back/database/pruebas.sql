-- Ejecutar DESPUÉS de seed.sql, mediante psql -f. Las pruebas de errores usan DO blocks.
SELECT 'Tablas' AS prueba, count(*) AS cantidad
FROM information_schema.tables WHERE table_schema='public' AND table_name IN
('usuarios','leads','resenas','escaneos','escaneo_leads');
SELECT 'Leads cargados' AS prueba, count(*) AS cantidad FROM leads;
SELECT 'Historial' AS prueba, e.id, l.nombre, el.rating_observado
FROM escaneo_leads el JOIN escaneos e ON e.id=el.escaneo_id JOIN leads l ON l.id=el.lead_id;

-- Demostración de UPSERT sin duplicar ni sobrescribir estado comercial:
INSERT INTO leads(id, fuente_id, nombre, rubro, ciudad, fuente, rating, num_resenas)
VALUES ('lead-otra-id','place-demo-001','Restaurante Central','Restaurantes','Bogotá','Google Maps',3.10,52)
ON CONFLICT (fuente, fuente_id) WHERE fuente_id IS NOT NULL
DO UPDATE SET rating=EXCLUDED.rating, num_resenas=EXCLUDED.num_resenas,
              ultimo_escaneo=now();
SELECT 'UPSERT' AS prueba, id, rating, num_resenas, estado FROM leads WHERE fuente_id='place-demo-001';

-- Segundo escaneo: mismo negocio, otra observación, sin duplicar lead
INSERT INTO escaneos(id,ciudad,rubro,plataformas,nuevos,actualizados,total,estado,duracion_seg)
VALUES ('scan-002','Bogotá','Restaurantes',ARRAY['Google Maps'],0,1,1,'completado',9)
ON CONFLICT (id) DO NOTHING;
INSERT INTO escaneo_leads(escaneo_id,lead_id,rating_observado,num_resenas_observadas)
VALUES ('scan-002','lead-001',3.10,52)
ON CONFLICT (escaneo_id,lead_id) DO NOTHING;
SELECT 'Historial doble' AS prueba, escaneo_id, lead_id, rating_observado FROM escaneo_leads ORDER BY escaneo_id;

DO $$ BEGIN
  BEGIN
    INSERT INTO leads(id, fuente_id, nombre, rubro, ciudad, fuente, rating, num_resenas)
    VALUES ('lead-error','place-demo-001','Duplicado','Restaurantes','Bogotá','Google Maps',2.0,20);
    RAISE EXCEPTION 'ERROR: la restricción UNIQUE no se aplicó';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'OK: duplicado de fuente_id rechazado';
  END;
  BEGIN
    INSERT INTO leads(id, fuente_id, nombre, rubro, ciudad, fuente, rating, num_resenas)
    VALUES ('lead-error-rating','place-demo-error','Rating invalido','Restaurantes','Bogotá','Google Maps',6.0,20);
    RAISE EXCEPTION 'ERROR: el CHECK de rating no se aplicó';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK: rating inválido rechazado';
  END;
END $$;
