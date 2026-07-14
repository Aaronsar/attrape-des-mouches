# 🪰 Attrape des Mouches

Jeu web où il faut attraper un maximum de mouches en 60 secondes !

## Jouer

Ouvre `index.html` dans ton navigateur, ou lance un serveur local :

```bash
npx serve .
```

Puis ouvre l'adresse affichée (souvent http://localhost:3000).

## Règles du jeu

### Objectif
Attraper le **maximum de mouches** avant la fin du chrono.

### Durée
Chaque partie dure **60 secondes**.

### Comment jouer
- **Clique** (souris) ou **touche** (écran tactile) une mouche pour l'attraper.
- Les mouches se déplacent et rebondissent sur les bords de l'écran.
- Si une mouche disparaît toute seule, tu perds des points.

### Types de mouches

| Mouche | Points | Comportement |
|--------|--------|--------------|
| 🪰 Classique | 10 pts | Vitesse normale |
| ⚡ Rapide | 25 pts | Plus petite, plus rapide |
| ✨ Dorée | 50 pts | Rare, brille, disparaît vite |

### Système de combo
Enchaîne **3 captures ou plus** sans laisser une mouche s'échapper : ta **prochaine capture** rapporte **le double de points** (x2).

### Pénalité
Quand une mouche s'échappe toute seule : **−5 points** (minimum 0).

### Difficulté progressive
Plus le temps avance :
- plus de mouches apparaissent ;
- elles bougent plus vite ;
- elles restent moins longtemps à l'écran.

### Score et record
Ton **meilleur score** est sauvegardé automatiquement dans le navigateur.

### Messages de fin

| Score | Message |
|-------|---------|
| 0 – 99 | Tu peux faire mieux ! |
| 100 – 249 | Pas mal pour un débutant ! |
| 250 – 399 | Belle chasse ! |
| 400 – 599 | Impressionnant ! |
| 600+ | LÉGENDAIRE ! |

Bon courage et bonne chasse ! 🪰
