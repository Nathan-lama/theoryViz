# 🌍 TheoryViz

**Explore les grandes théories dans un monde vivant.**

TheoryViz est une simulation 3D interactive où des créatures évoluent dans un écosystème dynamique. Chaque "théorie" reconfigure le monde, les créatures, les variables et les comportements pour illustrer un concept — évolution, marxisme, ou ton propre modèle.

![Screenshot](screenshot.png)

## 🚀 Installation

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173) dans ton navigateur.

## 📦 Build production

```bash
npm run build
npm run preview
```

## 🗺️ Routes

| Route | Description |
| --- | --- |
| `/` | Page d'accueil avec sélection de théorie |
| `/world` | Monde libre (sandbox) |
| `/world/:theoryId` | Monde avec théorie chargée (ex: `/world/evolution`) |

## 🧬 Théories disponibles

- **Évolution** 🧬 — Sélection naturelle, mutations, prédation
- **Marxisme** ⚒️ — Lutte des classes, capital, moyens de production
- **Monde Libre** 🌍 — Sandbox sans contraintes théoriques

## ➕ Ajouter une théorie

### Option 1 : Script automatique

```bash
bash scripts/new-theory.sh ma_theorie
```

### Option 2 : Manuel

1. Copie `src/theories/_template/` vers `src/theories/ma_theorie/`
2. Édite `config.json` (voir format ci-dessous)
3. Enregistre dans `src/theories/index.js` :

```js
import maTheorieConfig from './ma_theorie/config.json'

export const theories = {
  // ... existantes
  ma_theorie: maTheorieConfig,
}
```

## 📄 Format config.json

```jsonc
{
  "id": "mon_id",
  "title": "Ma Théorie",
  "description": "Description courte",
  "category": "science",
  "palette": {
    "primary": "#9C27B0",
    "accent": "#FF9800",
    "background": "#0e0e1a"       // Fond du ciel (optionnel)
  },

  // ── Monde ──
  "world": {
    "objects": {
      "trees":     { "enabled": true, "count": 80 },
      "houses":    { "enabled": false },
      "water":     { "enabled": true },
      "rocks":     { "enabled": true, "count": 30 },
      "flowers":   { "enabled": true, "count": 50 },
      "particles": { "enabled": true }
    },
    "sky":     { "sunPosition": [100, 20, 100], "turbidity": 8 },
    "terrain": { "color": "#2d5a1e" }
  },

  // ── Créatures ──
  "creatures": {
    "initialCount": 25,
    "initialTraits": {
      "speed":  { "min": 0.5, "max": 1.5 },
      "size":   { "min": 0.2, "max": 0.4 },
      "vision": { "min": 3, "max": 6 }
    },
    "behaviors": {
      "seekFood":  { "enabled": true },
      "flee":      { "enabled": true },
      "reproduce": { "enabled": true },
      "wander":    { "enabled": true }
    }
  },

  // ── Variables (sliders) ──
  "variables": {
    "foodAbundance": {
      "label": "Mon Label",       // Nom affiché
      "default": 50,              // Valeur initiale
      "min": 0, "max": 100,       // Bornes du slider
      "step": 5,                  // Pas du slider
      "description": "Tooltip",   // Description sous le slider
      "icon": "🔹"                // Emoji affiché à gauche
    },
    "predatorCount": { ... },
    "climate":       { ... },
    "mutationRate":  { ... },
    "resources":     { ... }
  },

  // ── Info Cards (apparaissent quand une condition est remplie) ──
  "infoCards": [
    {
      "trigger": {
        "type": "generation",     // "generation", "population", ou "variable"
        "operator": ">=",         // ">=", "<=", ">", "<", "=="
        "value": 5,
        "key": "foodAbundance"    // Seulement si type = "variable"
      },
      "title": "Titre",
      "text": "Texte explicatif"
    }
  ],

  // ── Scénarios (presets de variables) ──
  "scenarios": [
    {
      "name": "🏃 Mon Scénario",
      "description": "Description du scénario",
      "variables": { "foodAbundance": 20, "predatorCount": 10 }
    }
  ]
}
```

## 🔌 Systèmes modulaires

### Registre d'objets du monde

Chaque objet du monde (arbres, rochers, maisons...) est un plugin dans `src/world/objects/`. Pour ajouter un objet :

```js
// src/world/objects/monObjet.jsx
import { registerWorldObject } from '../registry'

function MonObjet({ count }) {
  // ... composant React Three Fiber
}

registerWorldObject({
  id: 'monObjet',
  label: 'Mon Objet',
  component: MonObjet,
  defaultCount: 20,
  minCount: 0,
  maxCount: 100,
  category: 'nature',        // 'nature', 'construction', 'décor'
})
```

### Registre de comportements

Les comportements des créatures sont dans `src/creatures/behaviorRegistry.js`. Pour ajouter un comportement :

```js
import { registerBehavior } from './creatures/behaviorRegistry'

registerBehavior({
  id: 'monBehavior',
  label: 'Mon Comportement',
  priority: 7,               // Plus c'est haut, plus c'est prioritaire
  phase: undefined,           // ou 'post' pour après le mouvement
  condition: (creature, worldState) => true,
  execute: (creature, worldState, dt) => ({
    angle: 0,                 // direction
    speedMultiplier: 1.0,     // vitesse
    ate: { foodId, energyGain }, // si mange
  }),
  theoryOverrides: {
    marxisme: { label: 'Version marxiste' },
  },
})
```

## 🏗️ Stack technique

| Technologie | Usage |
| --- | --- |
| **React 19** | UI + composants |
| **React Three Fiber** | Rendu 3D (three.js) |
| **@react-three/drei** | Helpers 3D (Sky, Billboard, Text, OrbitControls) |
| **@react-three/postprocessing** | Bloom, Vignette |
| **Zustand** | State management |
| **React Router v7** | Routing SPA |
| **Tailwind CSS v4** | Styles utilitaires |
| **Vite 7** | Bundler + dev server |

## 📁 Structure du projet

```
src/
├── core/               # Store Zustand, PostProcessing
├── creatures/           # Créatures, Prédateurs, traits, effets visuels
│   ├── behaviorRegistry.js   # Registre des comportements
│   ├── behaviors/             # Plugins de comportement (extensible)
│   ├── Creature.jsx
│   ├── Predator.jsx
│   ├── traits.js
│   └── EffectsManager.jsx
├── pages/               # HomePage, WorldPage
├── simulation/          # SimEngine (boucle de jeu)
├── theories/            # Configs théories + template
│   ├── _template/config.json
│   ├── evolution/config.json
│   ├── marxisme/config.json
│   └── index.js
├── ui/                  # ControlPanel, Timeline, Stats, InfoCard
├── world/               # Terrain, Food, Sky, WorldRenderer
│   ├── registry.js            # Registre des objets du monde
│   └── objects/               # Plugins d'objets (trees, houses, rocks, etc.)
├── styles/globals.css
├── App.jsx              # Router
└── main.jsx             # Point d'entrée
scripts/
└── new-theory.sh        # Script de création de théorie
```

## 🎮 Commandes

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run preview` | Preview du build |
| `npm run lint` | Lint ESLint |
| `bash scripts/new-theory.sh <nom>` | Créer une nouvelle théorie |

## 📜 Licence

MIT
