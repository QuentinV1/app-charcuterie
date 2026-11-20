# 📲 L'Affinoir - PWA (iOS, Android & Web)

Cette application web progressive (PWA) permet d'utiliser **L'Affinoir** directement sur iPhone (Safari iOS), Android (Chrome) et ordinateur comme une application native, sans APK à maintenir.

---

## 🚀 Fonctionnalités incluses

1. **📱 Expérience iOS Native & Plein Écran** :
   - Support complet de l'écran d'accueil iOS avec icône d'application haute résolution (`apple-touch-icon`).
   - Gestion des bordures d'encoche et safe-area iPhone (`viewport-fit=cover`).
   - Fonctionne **hors-ligne** grâce au Service Worker (`sw.js`).

2. **🥩 Catalogue Complet de 21 Charcuteries & Salaisons (Homogénéisé avec l'APK)** :
   - 21 recettes artisanales fidèles aux guides et à l'application native : Canard entier valorisé & Magrets séchés (découpe multi-sorties), Magrets séchés sans découpe, Jambon cru avec os, Pâté de sanglier, Jambon blanc, Coppa, Guanciale, Poitrine fumée/Pancetta, Bresaola, Gravlax de saumon, Gravlax de bœuf, Foie gras, Rillettes du Mans, Saucisses fraîches, Saucisse sèche/Chorizo, Lonzo, Sanglier séché, Saumon/Truite fumée, Maquereaux fumés chaud, Chevreuil séché, Viande fumée traditionnelle.
   - Fiches recettes complètes avec conditions de conservation, points de vigilance, grammages précis, découpes, épices et étapes.
   - Possibilité de **masquer / démasquer** des recettes et de créer des **recettes personnalisées**.

3. **📅 Planification & Suivi de Sessions Détaillé** :
   - Sélection des parties valorisées pour les découpes (ex: magrets, cuisses, rillettes, graisse, bouillons).
   - Répartition dynamique des lots d'assaisonnement (Paprika, Café, Fumé, Poivre, Espelette...).
   - Calcul économique automatique en temps réel (coût de revient unitaire et prix de revente conseillé).
   - **3 sous-onglets par session** :
     - **Planning** : checklist des étapes avec dates et heures calculées, étiquettes phases (Jour 1, Jour 2, Affinage) et astuces professionnelles.
     - **Production & Lots** : sorties réelles obtenues (ex: 10 L de graisse) et suivi des pesées d'affinage avec calcul automatique du pourcentage de déshydratation vs perte cible.
     - **Budget & Bilan** : synthèse financière complète (matière première, frais, valeur boutique, économie réalisée, marge de travail et bilan graisse).

4. **🛒 Liste de Courses Intelligente** :
   - Génération automatique selon les matières et lots planifiés.
   - Regroupée par session et par catégories (Viande, Sel & Sucre, Épices, Consommables).
   - Pastille dynamique sur l'onglet de navigation indiquant le nombre d'articles restant à acheter.
   - Modification en 1 clic et nettoyage des articles achetés.

5. **🤝 Module Revente & Gestion des Amis / Clients** :
   - Option activable / désactivable dans l'onglet **Réglages**.
   - Indicateurs financiers clés (Total commandes, Encaissé, Reste à percevoir).
   - Suivi des statuts de paiement (Wero/Paylib, Espèces, Virement) et de livraison.
   - Gestion du carnet d'adresses clients et historique d'achats.

6. **⚙️ Réglages & Configuration** :
   - Sous-onglet **Options & Tarifs** pour modifier les prix de base et valeurs boutique.
   - Sous-onglet **Lots à paramétrer** pour personnaliser les mélanges d'épices et temps de salage par recette.
   - Manuel d'installation iOS Safari conservé.
   - Démarrage à blanc par défaut (projets et courses initialement vides).
   - Sauvegarde et export/import JSON.

---

## 📲 Comment l'installer sur iPhone (Safari)

1. Déployez le dossier `pwa/` sur un hébergeur web HTTPS gratuit (par exemple **GitHub Pages**, **Vercel**, **Cloudflare Pages** ou **Netlify**), ou lancez un serveur local sur votre réseau Wi-Fi.
2. Ouvrez l'URL dans **Safari** sur votre iPhone.
3. Touchez le bouton **Partager** (le carré avec la flèche vers le haut au centre en bas).
4. Faites défiler les options et sélectionnez **"Sur l'écran d'accueil"**.
5. Touchez **"Ajouter"** en haut à droite.

L'icône **L'Affinoir** apparaît sur l'écran d'accueil de votre iPhone et s'ouvre en plein écran sans barre d'adresse de navigateur.
