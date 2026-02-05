# Dofus Bot Overlay - Quick Start

## 🎮 Qu'est-ce que c'est ?

Un outil **overlay Windows** pour le jeu Dofus qui automatise la recherche et le lancement de combats. L'application reste au-dessus du jeu et utilise la détection d'image pour identifier les ennemis.

## 📁 Structure du Projet

```
reddit_scroller/
├── reddit_overlay/              # Application Electron
│   ├── src/
│   │   ├── main/
│   │   │   ├── index.js        # Processus principal
│   │   │   └── dofusBot.js     # Logique du bot ⭐
│   │   ├── preload/
│   │   │   └── index.js        # Communication IPC
│   │   └── renderer/
│   │       └── src/
│   │           ├── AppDofus.jsx              # Application ⭐
│   │           └── components/
│   │               └── DofusBot.jsx          # Interface UI ⭐
│   │
│   ├── DOFUS_BOT_README.md     # 📖 Documentation technique
│   ├── USAGE_GUIDE.md          # 📖 Guide d'utilisation
│   └── package.json
│
└── IMPLEMENTATION_SUMMARY.md    # 📋 Résumé de l'implémentation
```

## 🚀 Installation Rapide

```bash
cd reddit_overlay
npm install
npm run dev
```

## 📖 Documentation

### Pour les Utilisateurs
👉 **[USAGE_GUIDE.md](reddit_overlay/USAGE_GUIDE.md)** - Comment utiliser l'application

### Pour les Développeurs
👉 **[DOFUS_BOT_README.md](reddit_overlay/DOFUS_BOT_README.md)** - Documentation technique

### Vue d'Ensemble
👉 **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Résumé complet de l'implémentation

## ⭐ Fonctionnalités Principales

- ✅ **5 états automatiques** : hors combat → recherche → placement → combat → attente
- ✅ **Capture de screenshots** automatique avec historique des 5 derniers
- ✅ **Détection d'ennemis** par comparaison d'images (avant/après appui sur 'Z')
- ✅ **Interface en temps réel** avec logs détaillés et indicateurs d'état
- ✅ **Overlay toujours visible** au-dessus du jeu
- ✅ **Paramètres configurables** pour ajuster la sensibilité de détection

## 🎯 Comment ça Marche

1. **Démarrage** : Le bot commence en état "hors de combat"
2. **Recherche** : 
   - Capture un screenshot
   - Simule l'appui sur 'Z' (affiche les ennemis dans Dofus)
   - Capture un second screenshot
   - Compare les deux images
3. **Détection** : Identifie les zones de différence (= positions des ennemis)
4. **Action** : Clique sur ces zones pour lancer le combat
5. **Combat** : Passe en mode combat avec gestion automatique des tours

## ⚠️ IMPORTANT - Lisez les Avertissements

**L'utilisation de bots est interdite par les CGU de Dofus et peut entraîner :**
- Ban permanent de votre compte
- Perte de tous vos personnages
- Blocage de votre IP

👉 Consultez les avertissements complets dans [DOFUS_BOT_README.md](reddit_overlay/DOFUS_BOT_README.md#sécurité-et-avertissements)

**Cet outil est fourni à titre éducatif uniquement. Utilisez-le à vos propres risques.**

## 🛠️ Technologies Utilisées

- **Electron** - Application desktop cross-platform
- **React** - Interface utilisateur
- **screenshot-desktop** - Capture d'écran
- **pixelmatch** - Comparaison d'images
- **pngjs** - Manipulation PNG

## 📝 Commandes Utiles

```bash
# Installation
cd reddit_overlay
npm install

# Développement
npm run dev

# Build de production
npm run build

# Build Windows (exécutable)
npm run build:win

# Linter
npm run lint

# Format du code
npm run format
```

## 🔍 État de l'Implémentation

### ✅ Fonctionnel
- Gestion des états du bot
- Capture et comparaison de screenshots
- Interface utilisateur complète
- Système de logs en temps réel
- Historique des screenshots

### ⏸️ Placeholders
- Simulation clavier (touche 'Z')
- Simulation souris (clics)

*Note : Les simulations clavier/souris nécessitent des modules natifs (robotjs) avec dépendances système non disponibles dans l'environnement de build actuel.*

## 📦 Fichiers Créés

### Nouveaux Modules (6 fichiers)
1. `reddit_overlay/src/main/dofusBot.js` - Logique du bot (360 lignes)
2. `reddit_overlay/src/renderer/src/AppDofus.jsx` - App principale
3. `reddit_overlay/src/renderer/src/components/DofusBot.jsx` - Interface UI (330 lignes)

### Documentation (3 fichiers)
4. `reddit_overlay/DOFUS_BOT_README.md` - Doc technique
5. `reddit_overlay/USAGE_GUIDE.md` - Guide utilisateur
6. `IMPLEMENTATION_SUMMARY.md` - Résumé complet

### Fichiers Modifiés (5 fichiers)
- `reddit_overlay/src/main/index.js` - Intégration IPC
- `reddit_overlay/src/preload/index.js` - API exposée
- `reddit_overlay/src/renderer/src/main.jsx` - Point d'entrée
- `reddit_overlay/package.json` - Nouvelles dépendances
- `reddit_overlay/.gitignore` - Exclure screenshots

## 🏆 Qualité du Code

- ✅ **0 vulnérabilités** (CodeQL scan)
- ✅ **Code formaté** (Prettier)
- ✅ **Build réussi** (Vite)
- ✅ **Review complète** (tous les commentaires adressés)

## 💡 Pour Commencer

1. **Lisez** le [USAGE_GUIDE.md](reddit_overlay/USAGE_GUIDE.md)
2. **Installez** les dépendances : `npm install`
3. **Lancez** en mode dev : `npm run dev`
4. **Testez** l'interface et les logs
5. **Consultez** la [documentation technique](reddit_overlay/DOFUS_BOT_README.md) pour plus de détails

## 🔗 Liens Rapides

- [Guide d'Utilisation](reddit_overlay/USAGE_GUIDE.md) 📖
- [Documentation Technique](reddit_overlay/DOFUS_BOT_README.md) 🔧
- [Résumé d'Implémentation](IMPLEMENTATION_SUMMARY.md) 📋

## 📞 Support

Pour toute question :
1. Consultez d'abord la documentation
2. Vérifiez les logs de l'application
3. Examinez le code source dans `src/main/dofusBot.js`

---

**Basé sur reddit_scroller** - Application overlay Electron + React
