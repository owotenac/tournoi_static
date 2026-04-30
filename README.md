# Tournoi ⚽ - Suivi en direct

Site mobile pour suivre les matchs du tournoi.

## Structure

```
public/
  data/
    vendredi_u11f.json   ← màj à chaque rotation
    vendredi_u13f.json
    vendredi_u15f.json
    samedi_u7.json
    samedi_u8.json
    dimanche_u9.json
src/
  App.tsx               ← tout le code UI ici
  main.tsx
```

## Format JSON

Chaque fichier suit ce format :

```json
{
  "section": "U11F",
  "jour": "Vendredi",
  "terrain": "Terrain A",
  "equipes": [
    {
      "id": "T1",
      "nom": "Paris FC",
      "points": 6,
      "joues": 2,
      "gagnes": 2,
      "nuls": 0,
      "perdus": 0,
      "buts_pour": 8,
      "buts_contre": 2
    }
  ],
  "matchs": [
    {
      "id": "M1",
      "heure": "09:00",
      "equipe_domicile": "T1",
      "equipe_exterieur": "T2",
      "score_domicile": 3,
      "score_exterieur": 1,
      "statut": "termine"   // "a_venir" | "en_cours" | "termine"
    }
  ]
}
```

## Statuts match

- `a_venir` → badge orange "À VENIR", pas de score
- `en_cours` → badge vert "● EN COURS", fond vert
- `termine` → badge gris "TERMINÉ", score affiché

## Déploiement Vercel

1. Push le repo sur GitHub
2. Connecter à Vercel → déploiement auto
3. Pour mettre à jour les scores : modifier le JSON → `git commit -m "score"` → `git push`
4. Vercel rebuild en ~30s, les parents voient les scores en raffraîchissant

Le site se raffraîchit automatiquement toutes les 60 secondes.

## Dev local

```bash
npm install
npm run dev
```
