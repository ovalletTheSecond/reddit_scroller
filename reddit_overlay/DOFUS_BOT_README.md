# Dofus Bot Overlay

## Description

Outil overlay Windows pour le jeu Dofus. Cette application crée une fenêtre overlay qui reste au-dessus du jeu et automatise certaines tâches de combat.

## Fonctionnalités

### États du Bot

Le bot gère plusieurs états différents :

1. **Hors de combat** (`out_of_combat`) - État par défaut
2. **Recherche de combat** (`searching_combat`) - Le bot cherche activement des ennemis
3. **Placement de début de combat** (`combat_placement`) - Positionnement initial en combat
4. **En combat, tour du joueur** (`combat_player_turn`) - C'est au tour du joueur d'agir
5. **En combat, attente** (`combat_waiting`) - Attente du début du prochain tour

### Phase de Recherche de Combat

Lorsque le bot est en mode recherche de combat, il :

1. ✅ Prend un premier screenshot de l'écran
2. ✅ Simule l'appui sur la touche 'Z' (pour afficher les ennemis)
3. ✅ Prend un deuxième screenshot avec la touche enfoncée
4. ✅ Calcule les différences entre les deux screenshots
5. ✅ Identifie les zones où des ennemis sont visibles
6. ✅ Clique sur ces zones pour lancer le combat
7. ✅ Affiche "entré en combat" dans les logs

### Gestion des Screenshots

- Le bot conserve un historique des 5 derniers screenshots
- Les screenshots plus anciens sont automatiquement supprimés
- Les screenshots sont sauvegardés dans le dossier `dofus_screenshots/`
- Les images de différences sont également sauvegardées pour le débogage

### Système de Logs

Le bot fournit des logs détaillés en temps réel :

- 🚀 Démarrage et arrêt du bot
- 🔄 Changements d'état
- 📸 Captures de screenshots
- ⌨️ Actions clavier/souris
- 🔍 Détection de différences
- ⚔️ Entrée en combat
- ❌ Erreurs et avertissements

## Installation

```bash
cd reddit_overlay
npm install
```

## Utilisation

### Mode Développement

```bash
npm run dev
```

### Build de Production

```bash
npm run build
```

### Build Windows

```bash
npm run build:win
```

## Technologies Utilisées

- **Electron** - Framework pour application desktop
- **React** - Interface utilisateur
- **screenshot-desktop** - Capture d'écran
- **pixelmatch** - Comparaison d'images
- **pngjs** - Manipulation d'images PNG

## Architecture

```
src/
├── main/
│   ├── index.js        # Processus principal Electron
│   └── dofusBot.js     # Logique du bot Dofus
├── preload/
│   └── index.js        # Script de préchargement (pont IPC)
└── renderer/
    └── src/
        ├── AppDofus.jsx              # Application principale
        └── components/
            └── DofusBot.jsx          # Interface utilisateur du bot
```

## Prochaines Étapes (Version Future)

- [ ] Reconnaissance de texte (OCR) pour valider que les différences sont bien des groupes de monstres
- [ ] Actions de combat automatisées pendant le tour du joueur
- [ ] Stratégies de placement en début de combat
- [ ] Configuration des préférences utilisateur
- [ ] Gestion des potions et ressources
- [ ] Détection de fin de combat

## Sécurité et Avertissements

⚠️ **IMPORTANT - LISEZ ATTENTIVEMENT** :

1. **Violation des Conditions d'Utilisation** : L'utilisation de bots automatisés est généralement **strictement interdite** par les conditions d'utilisation de Dofus et la plupart des jeux en ligne.

2. **Risque de Sanction** : L'utilisation de cet outil peut entraîner :
   - **Suspension temporaire** de votre compte
   - **Bannissement permanent** de votre compte
   - **Perte de tous vos personnages et objets**
   - **Blocage de votre adresse IP**

3. **Détection** : Les systèmes anti-triche modernes peuvent détecter :
   - Les patterns d'actions automatisées
   - Les mouvements de souris non-humains
   - Les temps de réaction trop rapides ou trop réguliers

4. **Responsabilité** :
   - Cet outil est fourni **à titre éducatif uniquement**
   - Les développeurs ne sont **pas responsables** des conséquences de son utilisation
   - Utilisez cet outil **entièrement à vos propres risques**

5. **Recommandations** :
   - N'utilisez cet outil que sur des comptes de test
   - Ne l'utilisez jamais sur des comptes contenant des personnages précieux
   - Comprenez que vous risquez de perdre définitivement l'accès à votre compte

⚠️ **En utilisant cet outil, vous reconnaissez avoir lu et compris ces avertissements.**

## Basé sur

Ce projet est basé sur l'architecture de `reddit_scroller`, une application overlay Electron + React.
