-- Datos ficticios de prueba. No son leads reales para Demo Day.
INSERT INTO usuarios(id, nombre, email) VALUES
('usr-001','Vendedora Demo','demo@repusense.example')
ON CONFLICT (id) DO NOTHING;

INSERT INTO leads (
  id, fuente_id, clave_dedupe, nombre, rubro, ciudad, fuente, rating, num_resenas,
  telefono, web, email, problema_ia, confianza_ia, origen_analisis, estado_analisis,
  draft_asunto, draft_cuerpo, estado, vendedor_id, ultimo_escaneo
) VALUES
('lead-001','place-demo-001',NULL,'Restaurante Central','Restaurantes','Bogotá','Google Maps',2.80,45,
 '+57 300 000 0001','https://example.org/restaurante',NULL,'demoras',88,'manual','completado',
 'Una oportunidad para mejorar','Hola, nos gustaría compartir ideas para mejorar la experiencia de sus clientes.',
 'nuevo',NULL,now()),
('lead-002','place-demo-002',NULL,'Clínica Norte','Clínicas dentales','Bogotá','Google Maps',3.20,28,
 NULL,NULL,'contacto@clinica.example','citas',81,'manual','completado',
 'Mejoremos la experiencia de sus pacientes','Hola, identificamos oportunidades para mejorar la atención.',
 'contactado','usr-001',now()),
('lead-003',NULL,'hotel plaza|cordoba|calle demo 123','Hotel Plaza','Hoteles','Córdoba','Yelp',2.50,18,
 NULL,NULL,NULL,NULL,NULL,NULL,'pendiente',NULL,NULL,'nuevo',NULL,now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO resenas (lead_id, fecha, texto, estrellas, huella_texto) VALUES
('lead-001','2026-10-20','La atención fue muy lenta.',1,encode(sha256(convert_to('lead-001|2026-10-20|1|la atención fue muy lenta.','UTF8')),'hex')),
('lead-001','2026-10-21','Esperamos demasiado por la comida.',2,encode(sha256(convert_to('lead-001|2026-10-21|2|esperamos demasiado por la comida.','UTF8')),'hex')),
('lead-002','2026-10-20','Fue difícil conseguir un turno.',2,encode(sha256(convert_to('lead-002|2026-10-20|2|fue difícil conseguir un turno.','UTF8')),'hex'))
ON CONFLICT (lead_id, huella_texto) DO NOTHING;

INSERT INTO escaneos(id, usuario_id, ciudad, rubro, plataformas, rating_min, rating_max,
 resenas_min, nuevos, actualizados, total, estado, duracion_seg)
VALUES ('scan-001','usr-001','Bogotá','Restaurantes',ARRAY['Google Maps'],1.50,3.50,11,1,0,1,'completado',12)
ON CONFLICT (id) DO NOTHING;
INSERT INTO escaneo_leads(escaneo_id,lead_id,rating_observado,num_resenas_observadas)
VALUES ('scan-001','lead-001',2.80,45)
ON CONFLICT (escaneo_id,lead_id) DO NOTHING;
