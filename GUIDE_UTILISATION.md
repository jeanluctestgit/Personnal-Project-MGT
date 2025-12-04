# Guide d'Utilisation - Application de Gestion de Projet

## Vue d'ensemble

Cette application permet de créer et gérer une hiérarchie complète de projets avec :
- Projets
- Objectifs Globaux
- Objectifs Spécifiques
- Tâches et Sous-projets (avec hiérarchie infinie)

## Structure Hiérarchique

```
📁 Projet 1
  ├─ 🎯 Objectif Global 1
  │   ├─ 🎯 Objectif Spécifique 1.1
  │   │   ├─ 📄 Tâche 1.1.1
  │   │   ├─ 📁 Sous-projet 1.1.2
  │   │   │   ├─ 📄 Tâche 1.1.2.1
  │   │   │   └─ 📄 Tâche 1.1.2.2
  │   │   └─ 📄 Tâche 1.1.3
  │   └─ 🎯 Objectif Spécifique 1.2
  └─ 🎯 Objectif Global 2
```

## Étape par Étape

### 1. Connexion

**Action** : Cliquez sur le bouton "Connexion" en haut à droite

Vous pouvez :
- Créer un nouveau compte (Inscription)
- Vous connecter avec un compte existant

**Important** : Vous devez être connecté pour créer ou modifier des éléments.

---

### 2. Créer un Projet

**Où** : Panneau central "Projets" (vue par défaut)

**Action** : Cliquez sur "+ Ajouter"

**Formulaire** :
- **Nom*** : Nom du projet (obligatoire)
- **Description** : Description détaillée
- **Contexte Métier** : Contexte dans lequel s'inscrit le projet
- **Public Visé** : À qui s'adresse le projet

**Exemple** :
```
Nom : Plateforme E-commerce
Description : Création d'une boutique en ligne moderne
Contexte Métier : Digitalisation de la vente au détail
Public Visé : Clients B2C et B2B
```

---

### 3. Ajouter un Objectif Global au Projet

**Où** :
1. Cliquez sur le projet dans l'arborescence (panneau de gauche)
2. Le panneau central affiche maintenant "Objectifs Globaux: [Nom du Projet]"

**Action** : Cliquez sur "+ Ajouter"

**Formulaire** :
- **Nom*** : Nom de l'objectif (obligatoire)
- **Description** : Description de l'objectif
- **Critères S.M.A.R.T** :
  - **Spécifique** : Objectif précis et clair
  - **Mesurable** : Comment mesurer la réussite
  - **Atteignable** : Objectif réaliste
  - **Réaliste** : En accord avec les ressources disponibles
  - **Temporel** : Date limite ou période

**Exemple** :
```
Nom : Développement du Site Web
Description : Créer une interface utilisateur moderne et responsive
SMART :
  - Spécifique : Site web avec catalogue produits et panier
  - Mesurable : 100% des fonctionnalités essentielles implémentées
  - Atteignable : Équipe de 3 développeurs disponible
  - Réaliste : Technologies maîtrisées par l'équipe
  - Temporel : Livraison en 3 mois
```

---

### 4. Ajouter un Objectif Spécifique à un Objectif Global

**Où** :
1. Cliquez sur un objectif global dans l'arborescence
2. Le panneau central affiche "Objectifs Spécifiques: [Nom de l'Objectif Global]"

**Action** : Cliquez sur "+ Ajouter"

**Formulaire** : Identique à l'objectif global (nom, description, critères SMART)

**Exemple** :
```
Nom : Interface Catalogue Produits
Description : Page d'affichage et recherche des produits
SMART :
  - Spécifique : Liste, filtres, recherche et tri des produits
  - Mesurable : 5 critères de filtrage minimum
  - Atteignable : 2 semaines de développement
  - Réaliste : Composants réutilisables disponibles
  - Temporel : Sprint 1 (semaines 1-2)
```

---

### 5. Ajouter une Tâche à un Objectif Spécifique

**Où** :
1. Cliquez sur un objectif spécifique dans l'arborescence
2. Le panneau central affiche "Tâches: [Nom de l'Objectif Spécifique]"

**Action** : Cliquez sur "+ Ajouter"

**Formulaire** :
- **Nom*** : Nom de la tâche (obligatoire)
- **Description** : Description détaillée
- **Contexte** : Informations contextuelles
- **Type*** :
  - 📄 **Tâche de Réalisation** : Tâche simple à réaliser
  - 📁 **Sous Projet** : Conteneur de tâches (peut avoir des sous-tâches)
- **Date Début** : Date de début prévue
- **Date Fin** : Date de fin prévue
- **Durée (jours)** : Durée estimée en jours
- **Priorité** : Niveau de priorité (0-10)
- **% Réalisation** : Pourcentage d'avancement (0-100)
- **Assigné à** : Ressource humaine responsable

**Exemple - Tâche Simple** :
```
Nom : Créer le composant de carte produit
Description : Composant React pour afficher un produit
Type : Tâche de Réalisation
Date Début : 2025-01-15
Date Fin : 2025-01-17
Durée : 3 jours
Priorité : 8
% Réalisation : 0
Assigné à : Jean Dupont
```

**Exemple - Sous-Projet** :
```
Nom : Système de Filtrage
Description : Ensemble complet du système de filtres
Type : Sous Projet
Date Début : 2025-01-18
Date Fin : 2025-01-25
Durée : 8 jours
Priorité : 9
% Réalisation : 0
Assigné à : Marie Martin
```

---

### 6. Créer une Hiérarchie de Sous-Tâches (Référence Circulaire)

**Principe** : Une tâche de type "Sous Projet" peut contenir d'autres tâches.

**IMPORTANT** : Pour l'instant, les sous-tâches ne sont pas encore implémentées dans l'interface, mais la structure de base de données est prête avec le champ `parent_task_id`.

**Structure préparée** :
```sql
tasks table:
  - id (identifiant de la tâche)
  - parent_task_id (référence vers la tâche parente, NULL si tâche racine)
  - type ('task' ou 'subproject')
  - specific_objective_id (lien vers l'objectif spécifique)
```

**Hiérarchie possible** :
```
📁 Sous-Projet : Système de Filtrage
  ├─ 📄 Tâche : Créer le composant de sélection
  ├─ 📄 Tâche : Implémenter la logique de filtrage
  ├─ 📁 Sous-Projet : Filtres Avancés
  │   ├─ 📄 Tâche : Filtre par prix
  │   ├─ 📄 Tâche : Filtre par catégorie
  │   └─ 📄 Tâche : Filtre par note
  └─ 📄 Tâche : Tests d'intégration
```

---

## Navigation dans l'Arborescence

### Panneau de Gauche (Arborescence)

- **Cliquez sur ▶** : Déplier un nœud
- **Cliquez sur ▼** : Replier un nœud
- **Cliquez sur le nom** : Sélectionner l'élément
  - Projet → Affiche les objectifs globaux
  - Objectif Global → Affiche les objectifs spécifiques
  - Objectif Spécifique → Affiche les tâches
  - Tâche → Affiche les détails (à venir)

### Panneau Central (Liste CRUD)

- Affiche les éléments du niveau sélectionné
- **+ Ajouter** : Créer un nouvel élément
- **Éditer** : Modifier un élément existant
- **Supprimer** : Supprimer un élément (avec confirmation)

**Contexte automatique** :
- Si aucun projet sélectionné → Liste des projets
- Si projet sélectionné → Liste des objectifs globaux de ce projet
- Si objectif global sélectionné → Liste des objectifs spécifiques
- Si objectif spécifique sélectionné → Liste des tâches

---

## Vues Disponibles

### Navigation Principale (En-tête)

- **Arborescence** : Vue hiérarchique (par défaut)
- **Kanban** : Vue par ressource humaine (à développer)
- **Gantt** : Planning temporel (à développer)
- **Calendrier** : Vue calendrier (à développer)
- **Ressources Humaines** : Gestion des équipes (à développer)

---

## Conseils d'Utilisation

### 1. Commencez par la Structure

Créez d'abord :
1. Les projets
2. Les objectifs globaux
3. Les objectifs spécifiques
4. Les tâches

### 2. Utilisez les Critères SMART

Remplissez toujours les critères SMART pour :
- Clarifier les objectifs
- Faciliter le suivi
- Mesurer la progression

### 3. Type de Tâche

Choisissez judicieusement le type :
- **Tâche simple** : Action atomique à réaliser
- **Sous-projet** : Groupe de tâches complexe nécessitant une décomposition

### 4. Assignation des Tâches

Créez d'abord des ressources humaines dans la section RH avant d'assigner des tâches.

### 5. Suivi de la Progression

Mettez à jour régulièrement le **% de Réalisation** pour suivre l'avancement.

---

## Fonctionnalités à Venir

### Sous-Tâches dans l'Interface
- Création de sous-tâches directement depuis une tâche parente
- Affichage de la hiérarchie complète dans l'arborescence

### Vues Kanban, Gantt et Calendrier
- Visualisation par ressource humaine
- Planning temporel
- Vue calendrier mensuelle/hebdomadaire

### Gestion des Pièces Jointes
- Upload vers Google Drive
- Association aux projets, objectifs et tâches

### Liste de Contrôle PDAC
- Gestion des étapes Plan, Do, Act, Check
- Suivi qualité des tâches

---

## Raccourcis et Astuces

- **Navigation rapide** : Utilisez l'arborescence pour naviguer rapidement
- **Édition rapide** : Double-cliquez sur un élément de la liste
- **Filtrage** : Les listes s'adaptent automatiquement au contexte sélectionné
- **Message de connexion** : Si vous voyez "Connectez-vous pour ajouter des éléments", cliquez sur "Connexion" en haut à droite

---

## Dépannage

### "Aucun élément disponible"
- Vérifiez que vous avez bien créé les éléments parents
- Assurez-vous d'être connecté

### "Connectez-vous pour ajouter des éléments"
- Cliquez sur le bouton "Connexion" en haut à droite
- Créez un compte ou connectez-vous

### Les éléments ne s'affichent pas
- Actualisez la page
- Vérifiez la connexion Internet
- Vérifiez que vous êtes bien connecté

---

## Structure Complète Exemple

```
📁 Projet : Plateforme E-commerce
  │
  ├─ 🎯 Objectif Global : Développement du Site Web
  │   │
  │   ├─ 🎯 Objectif Spécifique : Interface Catalogue Produits
  │   │   ├─ 📄 Tâche : Créer le composant de carte produit
  │   │   ├─ 📁 Sous-Projet : Système de Filtrage
  │   │   │   ├─ 📄 Tâche : Créer le composant de sélection
  │   │   │   ├─ 📄 Tâche : Implémenter la logique de filtrage
  │   │   │   └─ 📄 Tâche : Tests d'intégration
  │   │   └─ 📄 Tâche : Pagination de la liste
  │   │
  │   └─ 🎯 Objectif Spécifique : Système de Panier
  │       ├─ 📄 Tâche : Créer le composant panier
  │       ├─ 📄 Tâche : Gestion des quantités
  │       └─ 📄 Tâche : Calcul du total
  │
  └─ 🎯 Objectif Global : Intégration Paiement
      └─ 🎯 Objectif Spécifique : Gateway Stripe
          ├─ 📄 Tâche : Configuration Stripe
          ├─ 📄 Tâche : Créer le formulaire de paiement
          └─ 📄 Tâche : Gérer les webhooks
```
