# Guide d'Utilisation - Dofus Bot Overlay

## Installation

1. Naviguez vers le dossier du projet :

```bash
cd reddit_overlay
```

2. Installez les dépendances :

```bash
npm install
```

## Démarrage

### Mode Développement

Pour lancer l'application en mode développement :

```bash
npm run dev
```

L'application s'ouvrira avec une fenêtre overlay qui reste toujours au-dessus des autres fenêtres.

### Mode Production

Pour créer un build de production :

```bash
npm run build
```

Pour créer un exécutable Windows :

```bash
npm run build:win
```

L'exécutable sera créé dans le dossier `dist/`.

## Utilisation de l'Interface

### Contrôles Principaux

1. **Démarrer le Bot** (▶️) - Lance le bot et commence le cycle automatique
2. **Arrêter le Bot** (⏹️) - Arrête le bot immédiatement
3. **Effacer les logs** (🗑️) - Nettoie l'affichage des logs

### Indicateurs d'État

L'interface affiche en temps réel :

- **État actuel** - L'état dans lequel se trouve le bot (coloré selon l'état)
- **Screenshots** - Nombre de screenshots dans l'historique (max 5)

### États du Bot

Le bot passe automatiquement par différents états :

- 🟢 **Hors de combat** - État initial, prêt à chercher
- 🟠 **Recherche de combat** - Capture des screenshots et détection d'ennemis
- 🔵 **Placement de combat** - Phase de placement initial
- 🔴 **Tour du joueur** - C'est votre tour d'agir
- 🟣 **Attente de tour** - En attente du prochain tour

### Logs en Temps Réel

La zone de logs affiche toutes les actions du bot :

- Timestamp de chaque action
- Niveau de log (INFO, WARN, ERROR)
- Message détaillé de l'action

Les logs sont colorés selon leur importance :

- Bleu clair : Informations normales
- Orange : Avertissements
- Rouge : Erreurs

## Fonctionnement du Bot

### Phase de Recherche de Combat

1. Le bot capture un premier screenshot de l'écran
2. Simule l'appui sur la touche 'Z' (affichage des ennemis dans Dofus)
3. Capture un second screenshot avec la touche enfoncée
4. Compare les deux images pour détecter les différences
5. Les zones de différence représentent les positions d'ennemis
6. Clique sur ces positions pour lancer le combat

### Gestion des Screenshots

- Les screenshots sont sauvegardés dans `dofus_screenshots/`
- Seuls les 5 derniers screenshots sont conservés
- Les anciens fichiers sont automatiquement supprimés
- Les images de différence sont sauvegardées pour analyse

## Structure des Fichiers

```
reddit_overlay/
├── src/
│   ├── main/
│   │   ├── index.js         # Point d'entrée principal
│   │   └── dofusBot.js      # Logique du bot
│   ├── preload/
│   │   └── index.js         # Pont IPC Electron
│   └── renderer/
│       └── src/
│           ├── AppDofus.jsx              # App principale
│           └── components/
│               └── DofusBot.jsx          # Interface utilisateur
├── dofus_screenshots/       # Screenshots (généré automatiquement)
└── DOFUS_BOT_README.md      # Documentation
```

## Notes Importantes

### Version Actuelle

Cette version est une **implémentation de base** qui inclut :

- ✅ Gestion des états du bot
- ✅ Capture automatique de screenshots
- ✅ Détection de différences entre images
- ✅ Historique des 5 derniers screenshots
- ✅ Logs détaillés en temps réel
- ✅ Interface utilisateur complète

### Limitations Actuelles

Les actions clavier/souris sont actuellement des **placeholders** :

- L'appui sur la touche 'Z' est simulé (log uniquement)
- Les clics de souris sont simulés (log uniquement)

Pour une implémentation complète, il faudrait ajouter :

- Une bibliothèque de simulation d'entrées natives (ex: robotjs, mais nécessite des dépendances système)
- Ou utiliser des APIs Windows natives via FFI/N-API

### Versions Futures

Fonctionnalités prévues :

- Reconnaissance de texte (OCR) pour valider les groupes de monstres
- Simulation réelle des entrées clavier/souris
- Actions de combat automatisées
- Stratégies de placement configurables
- Gestion des potions et ressources
- Configuration utilisateur avancée

## Dépannage

### Le bot ne démarre pas

- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez les logs dans la console pour les erreurs

### Aucun screenshot capturé

- Assurez-vous que le dossier `dofus_screenshots/` existe
- Vérifiez les permissions d'écriture

### Les différences ne sont pas détectées

- Vérifiez que les deux screenshots sont bien capturés
- Les paramètres de détection peuvent nécessiter un ajustement (threshold dans `findDifferences`)

## Support

Pour toute question ou problème, consultez :

- Le fichier `DOFUS_BOT_README.md` pour la documentation technique
- Les logs de l'application pour les détails d'erreur
- Le code source dans `src/main/dofusBot.js` pour la logique du bot
