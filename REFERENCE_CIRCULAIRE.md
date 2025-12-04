# Guide : Référence Circulaire - Sous-Projets

## Concept

L'application permet maintenant une hiérarchie **infinie** grâce à la référence circulaire : une tâche de type "Sous-Projet" devient elle-même un projet complet avec ses propres objectifs globaux, objectifs spécifiques et tâches, qui peuvent à leur tour devenir des sous-projets.

## Structure Complète

```
📁 Projet Principal
  │
  └─ 🎯 Objectif Global 1
      │
      └─ 🎯 Objectif Spécifique 1.1
          │
          ├─ 📄 Tâche Simple 1.1.1
          │
          └─ 📁 Sous-Projet 1.1.2 (Type: Sous-Projet)
              │
              ├─ 🎯 Objectif Global du Sous-Projet 1
              │   │
              │   └─ 🎯 Objectif Spécifique 1
              │       │
              │       ├─ 📄 Tâche Simple
              │       │
              │       └─ 📁 Sous-Sous-Projet (Type: Sous-Projet)
              │           │
              │           └─ 🎯 Objectif Global...
              │               └─ ... (infini)
              │
              └─ 🎯 Objectif Global du Sous-Projet 2
                  └─ 🎯 Objectif Spécifique 2
                      └─ 📄 Tâche...
```

## Différence avec l'Ancien Système

### ❌ Ancien Système (parent_task_id)
```
Tâche Parente
  └─ Sous-tâche (parent_task_id → Tâche Parente)
      └─ Sous-sous-tâche (parent_task_id → Sous-tâche)
```

**Problème** : Une tâche ne peut avoir que d'autres tâches comme enfants, pas toute une hiérarchie projet.

### ✅ Nouveau Système (Référence Circulaire)
```
Tâche de type "Sous-Projet"
  └─ Objectif Global (task_id → Sous-Projet)
      └─ Objectif Spécifique
          └─ Tâche (peut être un nouveau Sous-Projet)
              └─ Objectif Global...
                  └─ ... (infini)
```

**Avantage** : Chaque sous-projet peut avoir une structure complète avec objectifs SMART, tâches assignées, etc.

---

## Comment Créer un Sous-Projet avec sa Hiérarchie

### Étape 1 : Créer une Tâche de type "Sous-Projet"

1. **Naviguez** jusqu'à un objectif spécifique
2. **Cliquez** sur "+ Ajouter" dans le panneau central (Tâches)
3. **Remplissez** le formulaire :
   - Nom : "Phase 1 - Développement Backend"
   - Type : **Sous Projet** ← Important !
   - Description, dates, priorité, etc.
4. **Cliquez** sur "Créer"

### Étape 2 : Créer des Objectifs Globaux pour le Sous-Projet

1. **Dans l'arborescence**, cliquez sur le sous-projet que vous venez de créer (📁 Phase 1 - Développement Backend)
2. Le panneau central affiche maintenant : **"Objectifs Globaux (Sous-Projet): Phase 1 - Développement Backend"**
3. **Cliquez** sur "+ Ajouter"
4. **Remplissez** les objectifs globaux du sous-projet :
   - Nom : "Architecture de la base de données"
   - Description : "Conception et implémentation du schéma"
   - Critères SMART
5. **Cliquez** sur "Créer"

### Étape 3 : Créer des Objectifs Spécifiques

1. **Dans l'arborescence**, dépliez le sous-projet (▶ → ▼)
2. **Cliquez** sur l'objectif global créé
3. Le panneau affiche : "Objectifs Spécifiques: Architecture de la base de données"
4. **Ajoutez** des objectifs spécifiques comme d'habitude

### Étape 4 : Créer des Tâches (qui peuvent aussi être des Sous-Projets)

1. **Cliquez** sur un objectif spécifique
2. **Ajoutez** des tâches
3. Si une tâche est complexe, choisissez **Type : Sous Projet**
4. Répétez le processus à l'infini !

---

## Exemple Concret : Plateforme E-commerce

### Niveau 1 : Projet Principal

```
📁 Plateforme E-commerce
```

### Niveau 2 : Objectifs Globaux du Projet

```
📁 Plateforme E-commerce
  └─ 🎯 Développement Technique Complet
```

### Niveau 3 : Objectifs Spécifiques

```
📁 Plateforme E-commerce
  └─ 🎯 Développement Technique Complet
      └─ 🎯 Mise en place du Backend
```

### Niveau 4 : Tâche = Sous-Projet

```
📁 Plateforme E-commerce
  └─ 🎯 Développement Technique Complet
      └─ 🎯 Mise en place du Backend
          └─ 📁 Phase 1 - API REST (Type: Sous-Projet)
```

### Niveau 5 : Objectifs Globaux du Sous-Projet

Maintenant, en **cliquant sur "Phase 1 - API REST"**, vous pouvez créer :

```
📁 Plateforme E-commerce
  └─ 🎯 Développement Technique Complet
      └─ 🎯 Mise en place du Backend
          └─ 📁 Phase 1 - API REST
              ├─ 🎯 Endpoints Produits
              ├─ 🎯 Endpoints Utilisateurs
              └─ 🎯 Endpoints Commandes
```

### Niveau 6 : Et ainsi de suite...

Chaque objectif global peut avoir des objectifs spécifiques, qui ont des tâches, qui peuvent devenir des sous-projets...

```
📁 Plateforme E-commerce
  └─ 🎯 Développement Technique Complet
      └─ 🎯 Mise en place du Backend
          └─ 📁 Phase 1 - API REST
              └─ 🎯 Endpoints Produits
                  └─ 🎯 CRUD Produits
                      ├─ 📄 Créer endpoint GET /products
                      ├─ 📄 Créer endpoint POST /products
                      └─ 📁 Gestion Images Produits (Sous-Projet)
                          └─ 🎯 Upload Images
                              └─ 🎯 Optimisation Images
                                  └─ 📄 Compression automatique
```

---

## Base de Données

### Table `global_objectives`

Ancienne structure :
```sql
- project_id (uuid) NOT NULL
```

Nouvelle structure :
```sql
- project_id (uuid) NULL
- task_id (uuid) NULL
- Contrainte : (project_id XOR task_id) = true
```

**Signification** :
- Si `project_id` est renseigné → Objectif global d'un projet principal
- Si `task_id` est renseigné → Objectif global d'un sous-projet (tâche)

### Exemple de Données

```sql
-- Objectif global du projet principal
INSERT INTO global_objectives (name, project_id, task_id)
VALUES ('Développement Technique', 'proj-123', NULL);

-- Objectif global d'un sous-projet (tâche)
INSERT INTO global_objectives (name, project_id, task_id)
VALUES ('Architecture API', NULL, 'task-456');
```

---

## Interface Utilisateur

### Panneau Central - Contextes

Le panneau central change automatiquement selon votre sélection :

| Élément sélectionné | Contexte affiché | Vous pouvez ajouter |
|-------------------|------------------|-------------------|
| Aucun | Projets | Nouveau projet |
| Projet | Objectifs Globaux: [Projet] | Objectif global du projet |
| Tâche (Sous-Projet) | **Objectifs Globaux (Sous-Projet): [Tâche]** | Objectif global du sous-projet |
| Objectif Global | Objectifs Spécifiques | Objectif spécifique |
| Objectif Spécifique | Tâches | Tâche ou Sous-Projet |

### Arborescence - Icônes

- 📁 Projet ou Sous-Projet (dépliable)
- 🎯 Objectif Global ou Spécifique (dépliable)
- 📄 Tâche simple (non dépliable)

---

## Cas d'Usage

### 1. Projet Construction de Maison

```
📁 Construction Maison Familiale
  └─ 🎯 Phase Gros Œuvre
      └─ 🎯 Fondations
          └─ 📁 Coulage Dalle Béton (Sous-Projet)
              ├─ 🎯 Préparation
              │   └─ 🎯 Terrassement
              │       └─ 📄 Excavation
              └─ 🎯 Ferraillage
                  └─ 🎯 Pose Armatures
                      └─ 📁 Section Nord (Sous-Projet complexe)
```

### 2. Développement Logiciel

```
📁 Application Mobile
  └─ 🎯 Développement Features
      └─ 🎯 Module Authentification
          └─ 📁 OAuth 2.0 (Sous-Projet)
              ├─ 🎯 Google Sign-In
              ├─ 🎯 Facebook Login
              └─ 🎯 Apple Sign-In
                  └─ 🎯 Configuration iOS
                      └─ 📁 Certificats (Sous-Projet administratif)
```

### 3. Campagne Marketing

```
📁 Campagne Printemps 2025
  └─ 🎯 Stratégie Digitale
      └─ 🎯 Social Media
          └─ 📁 TikTok Campaign (Sous-Projet)
              ├─ 🎯 Création Contenu
              │   └─ 🎯 Vidéos Courtes
              │       └─ 📁 Série "Tips & Tricks" (5 épisodes)
              └─ 🎯 Influenceur Partnership
```

---

## Avantages de la Référence Circulaire

### ✅ Flexibilité Totale
Chaque niveau peut devenir aussi complexe que nécessaire

### ✅ Objectifs SMART à Tous les Niveaux
Définissez des critères SMART même pour les sous-projets

### ✅ Assignation Précise
Assignez des ressources humaines à chaque tâche, même imbriquée

### ✅ Suivi Détaillé
Suivez l'avancement à n'importe quel niveau de profondeur

### ✅ Organisation Naturelle
Reflète la vraie complexité des projets réels

---

## Astuces et Bonnes Pratiques

### 1. Quand Créer un Sous-Projet ?

Créez un sous-projet quand :
- ✅ La tâche nécessite plusieurs objectifs distincts
- ✅ Vous voulez suivre des critères SMART spécifiques
- ✅ Plusieurs personnes travaillent sur différents aspects
- ✅ La complexité justifie une décomposition structurée

Restez sur une tâche simple quand :
- ❌ C'est une action unique et atomique
- ❌ Une seule personne peut la réaliser
- ❌ Pas besoin de sous-objectifs

### 2. Nommage Clair

Utilisez des préfixes pour clarifier :
- "Phase 1 - ..." pour les sous-projets temporels
- "Module ..." pour les composants fonctionnels
- "Sprint X - ..." pour la méthodologie agile

### 3. Profondeur Raisonnable

Bien que l'infini soit possible, limitez-vous à **3-4 niveaux de sous-projets** pour maintenir la clarté.

### 4. Documentation

Utilisez les champs Description et Contexte pour expliquer pourquoi un sous-projet existe.

---

## Dépannage

### Le panneau n'affiche pas "Objectifs Globaux (Sous-Projet)"

**Cause** : La tâche n'est pas de type "Sous-Projet"
**Solution** : Éditez la tâche et changez le Type en "Sous Projet"

### Les objectifs globaux n'apparaissent pas dans l'arborescence

**Cause** : Le nœud n'est pas déplié
**Solution** : Cliquez sur ▶ à côté du sous-projet

### Impossible de créer un objectif global

**Cause** : Vous n'avez pas sélectionné un sous-projet
**Solution** : Cliquez sur la tâche de type "Sous-Projet" dans l'arborescence

---

## Comparaison Visuelle

### Structure Classique (Sans Référence Circulaire)

```
Projet
  └─ Phase
      └─ Module
          └─ Tâche
              └─ Sous-tâche (juste une tâche enfant)
```

**Limitation** : Pas de structure complète pour la sous-tâche

### Structure avec Référence Circulaire

```
Projet
  └─ Objectif Global
      └─ Objectif Spécifique
          └─ Sous-Projet
              └─ Objectif Global ← Recommence la hiérarchie !
                  └─ Objectif Spécifique
                      └─ Tâche ou Sous-Projet
                          └─ ... (infini)
```

**Avantage** : Structure complète à chaque niveau

---

## Résumé

La référence circulaire transforme l'application en un système de gestion de projet **fractal** où chaque tâche peut devenir un projet complet. Cela permet de gérer des projets de toutes tailles et complexités avec la même structure cohérente.

**Formule Magique** :
```
Projet = Objectifs Globaux → Objectifs Spécifiques → Tâches
Tâche (Type: Sous-Projet) = Nouveau Projet ← Référence circulaire !
```
