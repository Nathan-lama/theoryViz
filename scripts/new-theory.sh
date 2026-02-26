#!/bin/bash
# ─────────────────────────────────────────────────────────
# new-theory.sh — Crée une nouvelle théorie pour TheoryViz
# Usage: bash scripts/new-theory.sh mon_nom_de_theorie
# ─────────────────────────────────────────────────────────

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: bash scripts/new-theory.sh <nom_de_la_theorie>"
  echo "   Exemple: bash scripts/new-theory.sh capitalisme"
  exit 1
fi

THEORY_ID="$1"
THEORY_DIR="src/theories/$THEORY_ID"
TEMPLATE_DIR="src/theories/_template"

if [ -d "$THEORY_DIR" ]; then
  echo "❌ La théorie '$THEORY_ID' existe déjà dans $THEORY_DIR"
  exit 1
fi

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "❌ Template introuvable dans $TEMPLATE_DIR"
  exit 1
fi

# Copie le template
cp -r "$TEMPLATE_DIR" "$THEORY_DIR"

# Remplace les placeholders
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/TEMPLATE_ID/$THEORY_ID/g" "$THEORY_DIR/config.json"
  sed -i '' "s/TEMPLATE_TITLE/$THEORY_ID/g" "$THEORY_DIR/config.json"
else
  # Linux / Git Bash
  sed -i "s/TEMPLATE_ID/$THEORY_ID/g" "$THEORY_DIR/config.json"
  sed -i "s/TEMPLATE_TITLE/$THEORY_ID/g" "$THEORY_DIR/config.json"
fi

echo ""
echo "✅ Théorie '$THEORY_ID' créée dans $THEORY_DIR/"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Édite $THEORY_DIR/config.json :"
echo "      - Mets un vrai titre et description"
echo "      - Choisis ta palette de couleurs (primary + accent)"
echo "      - Renomme les labels des 5 variables"
echo "      - Ajoute des scénarios et des infoCards"
echo ""
echo "   2. Enregistre la théorie dans src/theories/index.js :"
echo "      import ${THEORY_ID}Config from './${THEORY_ID}/config.json'"
echo "      // Ajoute dans l'objet theories :"
echo "      ${THEORY_ID}: ${THEORY_ID}Config,"
echo ""
echo "   3. Relance le dev server (npm run dev) et va sur /"
echo "      Ta théorie apparaîtra comme nouvelle carte !"
echo ""
