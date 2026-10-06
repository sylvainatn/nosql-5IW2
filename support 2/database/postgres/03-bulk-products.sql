-- Génération de produits fictifs pour observer l'impact des index.
-- Volume : 1 000 000 de lignes (ids >= 1000 pour ne pas entrer en conflit avec 02-seed.sql).

INSERT INTO products (id, name, description, price)
SELECT
  i,
  marque || ' ' || modele || ' ' || (100 + i % 900),
  'Produit fictif ' || i || ' — ' || modele || ' de la marque ' || marque || ', génération ' || (2018 + i % 8),
  round((5 + (i::bigint * 7919 % 200000) / 100.0)::numeric, 2)
FROM generate_series(1000, 1000999) AS i,
LATERAL (
  SELECT
    (ARRAY['Acme','Nordika','Volta','Kaido','Lumen','Orbita','Brixon','Sielva','Teknor','Marisa'])[1 + i % 10]   AS marque,
    (ARRAY['Clavier','Souris','Écran','Casque','Webcam','Dock','Chargeur','Sacoche','Tapis','Micro'])[1 + (i / 10) % 10] AS modele
) AS n;

ANALYZE products;
