# Germantris – Evaluation Results

## Base Model Evaluation
**Modell:** sentence-transformers/all-MiniLM-L6-v2  
**Spearman Korrelation:** 0.09  
**Datensatz:** 700 deutsche Wortpaare (80/10/10 Split)

## Beobachtungen Phase 2 (Embedding Exploration)
- Base Model zeigt inkonsistente Similarities bei einzelnen deutschen Wörtern
- Katze/Auto ähnlicher als Katze/Hund → Base Model auf Wortebene unzuverlässig
- t-SNE Visualisierung zeigt keine klaren semantischen Cluster
- Hund clustert mit Schrank statt mit Katze/Vogel

## Fazit
Fine-Tuning auf deutschen Wortpaaren notwendig um semantische 
Wortähnlichkeit korrekt abzubilden.