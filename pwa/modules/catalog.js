// Catalogue initial et paramètres par défaut
// 1. Catalogue de base complet (21 recettes artisanales issues des guides & APK)
export const CATALOGUE_BASE = [
  {
    "id": "VALORISATION_CANARD",
    "code": "VALORISATION_CANARD",
    "nom": "Canard entier valorisé & Magrets séchés",
    "famille": "Canard",
    "typeRecette": "DECOUPE",
    "type": "DECOUPE",
    "uniteBase": "canard",
    "unite": "canard",
    "quantiteDefaut": 10,
    "perteCiblePct": 32,
    "perteCible": 32,
    "tempCoeurCible": null,
    "conditionsConservation": "Réfrigérateur 2-4 °C (torchon pour magrets séchés 3 à 6 semaines, sous vide pour confits, bocaux stérilisés pour rillettes/bouillons)",
    "pointsVigilance": "Maintenir le confisage entre 85 °C et 90 °C sans ébullition. Laisser refroidir complètement les cuisses avant la mise sous vide. Stérilisation des rillettes 2 h à 100 °C.",
    "description": "Transformation complète de canards gras (sans foie gras par défaut) sur un week-end : découpe, magrets séchés déclinés en variantes (Paprika, Café, Fumé, Poivre...), cuisses confites, rillettes, bouillons, graisse et grattons.",
    "masquee": false,
    "sortiesDecoupe": [
      {
        "codeSortie": "magret",
        "nom": "Magrets séchés",
        "unite": "pièce",
        "rendementParUniteBase": 2,
        "valeurRefBoutiqueUnitaire": 14,
        "fraisTransfoUnitaire": 0.88,
        "cocheParDefaut": true
      },
      {
        "codeSortie": "cuisse",
        "nom": "Cuisses confites",
        "unite": "pièce",
        "rendementParUniteBase": 2,
        "valeurRefBoutiqueUnitaire": 7,
        "fraisTransfoUnitaire": 0.6,
        "cocheParDefaut": true
      },
      {
        "codeSortie": "rillettes",
        "nom": "Rillettes (cou + carcasse + manchons)",
        "unite": "kg",
        "rendementParUniteBase": 0.25,
        "valeurRefBoutiqueUnitaire": 28,
        "fraisTransfoUnitaire": 2,
        "cocheParDefaut": true
      },
      {
        "codeSortie": "bouillon",
        "nom": "Bouillons de carcasse (50 cl)",
        "unite": "bocal",
        "rendementParUniteBase": 2,
        "valeurRefBoutiqueUnitaire": 3,
        "fraisTransfoUnitaire": 0.6,
        "cocheParDefaut": true
      },
      {
        "codeSortie": "gratton",
        "nom": "Grattons",
        "unite": "kg",
        "rendementParUniteBase": 0.2,
        "valeurRefBoutiqueUnitaire": 22,
        "fraisTransfoUnitaire": 1,
        "cocheParDefaut": true
      },
      {
        "codeSortie": "graisse",
        "nom": "Graisse fondue / en pot",
        "unite": "L",
        "rendementParUniteBase": 0.5,
        "valeurRefBoutiqueUnitaire": 12,
        "fraisTransfoUnitaire": 2,
        "cocheParDefaut": true
      },
      {
        "codeSortie": "aiguillettes",
        "nom": "Aiguillettes (sous vide)",
        "unite": "pièce",
        "rendementParUniteBase": 2,
        "valeurRefBoutiqueUnitaire": 2.5,
        "fraisTransfoUnitaire": 0.2,
        "cocheParDefaut": true
      },
      {
        "codeSortie": "gesier",
        "nom": "Gésiers confits (si dispo)",
        "unite": "pièce",
        "rendementParUniteBase": 1,
        "valeurRefBoutiqueUnitaire": 3.5,
        "fraisTransfoUnitaire": 0.3,
        "cocheParDefaut": false
      },
      {
        "codeSortie": "foie",
        "nom": "Foie gras (absent par défaut)",
        "unite": "pièce",
        "rendementParUniteBase": 1,
        "valeurRefBoutiqueUnitaire": 35,
        "fraisTransfoUnitaire": 1.5,
        "cocheParDefaut": false
      }
    ],
    "variantes": [
      {
        "nom": "Paprika",
        "descriptionEpices": "Paprika doux ou fumé sur toute la surface",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 24,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Café",
        "descriptionEpices": "Mélange café moulu fin + poivre noir",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 24,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Fumé",
        "descriptionEpices": "Poivre côté chair + fumage à froid 8 à 12h au bois de hêtre",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 20,
        "ajouteEtapeFumage": true
      },
      {
        "nom": "Poivre",
        "descriptionEpices": "Poivre noir concassé généreux",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 24,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Piment d'Espelette",
        "descriptionEpices": "Piment d'Espelette AOP",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 24,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Gros sel non iodé (magrets : 500g/magret)",
        "nom": "Gros sel non iodé (magrets : 500g/magret)",
        "modeCalcul": "PAR_PIECE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 1,
        "prix": 1
      },
      {
        "nomIngredient": "Gros sel non iodé (cuisses & cous)",
        "nom": "Gros sel non iodé (cuisses & cous)",
        "modeCalcul": "PAR_PIECE",
        "quantite": 400,
        "qte": 400,
        "unite": "g",
        "prixKgOuUniteEstime": 1,
        "prix": 1
      },
      {
        "nomIngredient": "Épices pour magrets (15g/magret)",
        "nom": "Épices pour magrets (15g/magret)",
        "modeCalcul": "PAR_PIECE",
        "quantite": 30,
        "qte": 30,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      },
      {
        "nomIngredient": "Garniture bouillon (carottes, oignons, ail, thym, laurier)",
        "nom": "Garniture bouillon (carottes, oignons, ail, thym, laurier)",
        "modeCalcul": "PAR_PIECE",
        "quantite": 1,
        "qte": 1,
        "unite": "lot",
        "prixKgOuUniteEstime": 0.8,
        "prix": 0.8
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Samedi · Le Marathon de la Découpe",
        "instructions": "• Installez un poste propre et frais. Sortez les canards au fur et à mesure.\n• Découpe systématique : levez les magrets, puis les cuisses, les manchons, les aiguillettes. Séparez les cous et coupez les têtes.\n• Nettoyage immédiat : retirez les yeux des têtes. Grattez les carcasses pour récupérer la viande destinée aux rillettes.",
        "astuce": "Rangez au fur et à mesure vos pièces par catégories dans de grands plats au frais.",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 180,
        "dureeH": 3,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Samedi · Tri des Gras & Salaison Flash (Magrets à fumer)",
        "instructions": "• Séparez le gras pur (cubes) du gras avec peau/viande (pour les grattons).\n• Mise au sel prioritaire des magrets à fumer : mettez-les immédiatement au gros sel dans un plat à part au réfrigérateur (20 h de sel pour lancer le fumage tôt demain).",
        "astuce": "",
        "offsetDebutMinutes": 180,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": "Fumé",
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Samedi · Mise au sel du Reste & Conditionnement",
        "instructions": "• Mettez les autres magrets, les cuisses et les cous destinés au confit au gros sel (au réfrigérateur pour 24 h).\n• Mettez sous vide la majorité des aiguillettes (congélateur). Gardez le reste pour les rillettes.",
        "astuce": "",
        "offsetDebutMinutes": 225,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Samedi · Le Grand Rôtissage & Fonte du Gras",
        "instructions": "• Préchauffez le four à 200 °C. Enfournez les carcasses concassées et les têtes pour les faire dorer.\n• Dans la grande marmite, mettez tout le gras à fondre à feu très doux.",
        "astuce": "",
        "offsetDebutMinutes": 270,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 5,
        "titre": "Samedi · Lancement du Bouillon",
        "instructions": "• Transférez les carcasses et têtes rôties dans un faitout. Ajoutez garnitures (carottes, oignons, ail, thym, laurier) et mouillez à l'eau froide. Portez à frémissement.",
        "astuce": "",
        "offsetDebutMinutes": 330,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 6,
        "titre": "Samedi · Clarification du Gras, Grattons & Déglaçage",
        "instructions": "• Passez le gras fondu à la passoire fine pour stocker la graisse blanche pure.\n• Remettez les peaux dans la marmite à feu vif pour dorer les grattons. Égouttez, salez, poivrez.\n• Le geste pro : déglacez la marmite des grattons à l'eau froide, grattez les sucs et versez dans le bouillon.",
        "astuce": "",
        "offsetDebutMinutes": 390,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 7,
        "titre": "Samedi · Pré-cuisson des Rillettes (2h)",
        "instructions": "• Dans la marmite libérée, mettez manchons, viande de carcasse, aiguillettes restantes et cous non confits. Couvrez de graisse fraîche et laissez mijoter à feu doux 2 h.\n• En fin de cuisson : éteignez bouillon et rillettes, laissez refroidir toute la nuit.",
        "astuce": "",
        "offsetDebutMinutes": 450,
        "dureeMinutes": 120,
        "dureeH": 2,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 8,
        "titre": "Dimanche · Dessalage des Magrets Fumés",
        "instructions": "• Sortez les magrets destinés au fumage (après ~20 h de sel).\n• Plongez-les dans un grand bac d'eau froide pendant 1 heure en changeant l'eau une fois.",
        "astuce": "",
        "offsetDebutMinutes": 1350,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": "Fumé",
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 9,
        "titre": "Dimanche · Lancement du Fumage à froid",
        "instructions": "• Séchez méticuleusement les magrets à fumer. Poivrez le côté chair.\n• Installez-les dans le fumoir à froid pour la journée (8 à 12 heures de manière autonome).",
        "astuce": "",
        "offsetDebutMinutes": 1410,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": "Fumé",
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 10,
        "titre": "Dimanche · Dessalage Cuisses & Autres Magrets",
        "instructions": "• Sortez les cuisses, cous et les autres magrets du sel (après 24 h).\n• Plongez-les 1 heure dans l'eau froide pour enlever l'excès de sel.",
        "astuce": "",
        "offsetDebutMinutes": 1650,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 11,
        "titre": "Dimanche · Épiçage par lot (Paprika, Café...) & Immersion Cuisses",
        "instructions": "• Séchez parfaitement les magrets. Appliquez les épices selon chaque lot (Paprika, Café, Poivre...), roulez-les dans des torchons propres et placez-les en bas du frigo (3 à 6 semaines).\n• Séchez les cuisses et plongez-les dans la graisse fondue chaude (complètement immergées).",
        "astuce": "",
        "offsetDebutMinutes": 1710,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 12,
        "titre": "Dimanche · Confisage traditionnel des cuisses (3h)",
        "instructions": "• Maintenez la graisse à très petits frémissements (85 °C - 90 °C max, ne jamais bouillir).\n• Les cuisses sont prêtes quand la chair se rétracte le long de l'os du pilon.",
        "astuce": "",
        "offsetDebutMinutes": 1740,
        "dureeMinutes": 180,
        "dureeH": 3,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 13,
        "titre": "Dimanche · Finalisation des Rillettes (en parallèle)",
        "instructions": "• Rallumez sous la marmite de rillettes pour liquéfier la graisse.\n• Sortez les morceaux à chaud, désossez manchons et cous.\n• Écrasez à la fourchette (pas de mixeur) et ajustez avec un peu de graisse.",
        "astuce": "",
        "offsetDebutMinutes": 1740,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 14,
        "titre": "Dimanche · Mise en bocaux & Stérilisation (2h à 100°C)",
        "instructions": "• Mettez les rillettes en bocaux stériles (laissez 2 cm d'air en haut), fermez hermétiquement.\n• Stérilisez 2 heures à 100 °C à partir de l'ébullition.",
        "astuce": "",
        "offsetDebutMinutes": 1800,
        "dureeMinutes": 120,
        "dureeH": 2,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 15,
        "titre": "Dimanche · Refroidissement & Mise sous vide des Cuisses",
        "instructions": "• Sortez délicatement les cuisses sur une grille, laissez refroidir complètement puis passez au frigo.\n• Une fois bien froides et fermes, glissez-les en sachets avec 1 cuillère de graisse figée, scellez sous vide et congelez.",
        "astuce": "",
        "offsetDebutMinutes": 1920,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 16,
        "titre": "Dimanche soir · Sortie du fumoir & Filtrage bouillon",
        "instructions": "• Sortez les magrets fumés du fumoir, enveloppez-les en torchon et mettez-les au frigo avec les autres.\n• Filtrez le bouillon de carcasse (retirez le disque de graisse figée en surface).",
        "astuce": "",
        "offsetDebutMinutes": 2040,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 17,
        "titre": "J+21 à J+42 · Contrôle séchage des Magrets (3 à 6 semaines)",
        "instructions": "• Vérifiez le séchage et pesez les magrets (objectif ~30-35% de perte).\n• Optionnel : placez sous vide pendant 20 jours pour homogénéiser le moelleux.",
        "astuce": "",
        "offsetDebutMinutes": 30240,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "MAGRET_SECHE_SEUL",
    "code": "MAGRET_SECHE_SEUL",
    "nom": "Magrets séchés (sans découpe)",
    "famille": "Canard",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "pièce",
    "unite": "pièce",
    "quantiteDefaut": 10,
    "perteCiblePct": 32,
    "perteCible": 32,
    "tempCoeurCible": null,
    "conditionsConservation": "Bas du réfrigérateur (4 °C) en torchon pendant 3 à 6 semaines, puis sous vide 20 jours.",
    "pointsVigilance": "Bien sécher après le dessalage. Pour modifier le temps de salage (ex: passer de 24h à 18h si trop salé), utilisez le bouton Ajuster la recette.",
    "description": "Recette artisanale de magrets séchés avec base de salage commune et déclinaison en lots d'épices (Paprika, Café, Fumé, Poivre, Espelette).",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Paprika",
        "descriptionEpices": "Paprika doux ou fumé (15 g/magret)",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 24,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Café",
        "descriptionEpices": "Café moulu + poivre (15 g/magret)",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 24,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Fumé",
        "descriptionEpices": "Poivre + fumage à froid 8-12 h",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 20,
        "ajouteEtapeFumage": true
      },
      {
        "nom": "Poivre",
        "descriptionEpices": "Poivre noir concassé (15 g/magret)",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 24,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Gros sel non iodé",
        "nom": "Gros sel non iodé",
        "modeCalcul": "PAR_PIECE",
        "quantite": 500,
        "qte": 500,
        "unite": "g",
        "prixKgOuUniteEstime": 1,
        "prix": 1
      },
      {
        "nomIngredient": "Épices (selon variantes)",
        "nom": "Épices (selon variantes)",
        "modeCalcul": "PAR_PIECE",
        "quantite": 15,
        "qte": 15,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Salage au gros sel (24 h)",
        "instructions": "Saler les magrets au gros sel pendant 24 h au réfrigérateur (20 h pour les fumés).",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 1440,
        "dureeH": 24,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage et dessalage (1 h)",
        "instructions": "Rincer puis dessaler pendant 1 heure dans l'eau froide en changeant l'eau une fois. Bien sécher au papier absorbant.",
        "astuce": "",
        "offsetDebutMinutes": 1440,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Fumage à froid (lot Fumé)",
        "instructions": "Fumer à froid au bois de hêtre pendant 8 à 12 heures.",
        "astuce": "",
        "offsetDebutMinutes": 1500,
        "dureeMinutes": 600,
        "dureeH": 10,
        "varianteCible": "Fumé",
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Épiçage par lot et mise en torchon",
        "instructions": "Répartir les épices (Paprika, Café, Poivre...) sur chaque lot et rouler dans des torchons propres.",
        "astuce": "",
        "offsetDebutMinutes": 1500,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 5,
        "titre": "Séchage 3 à 6 semaines",
        "instructions": "Faire sécher au bas du réfrigérateur ou endroit frais ventilé pendant 3 à 6 semaines (perte cible ~32%).",
        "astuce": "",
        "offsetDebutMinutes": 30240,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 6,
        "titre": "Optionnel : Sous vide 20 jours",
        "instructions": "Placer sous vide pendant 20 jours au réfrigérateur pour égaliser l'humidité.",
        "astuce": "",
        "offsetDebutMinutes": 59040,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": true
      }
    ]
  },
  {
    "id": "JAMBON_CRU",
    "code": "JAMBON_CRU",
    "nom": "Jambon cru de cochon",
    "famille": "Porc",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 10,
    "perteCiblePct": 35,
    "perteCible": 35,
    "tempCoeurCible": null,
    "conditionsConservation": "Salage : 1 à 4 °C | Repos : 4 à 8 °C | Séchage : 10 à 15 °C (70-80% HR) | Affinage : 12 à 18 °C (60-70% HR)",
    "pointsVigilance": "• Moisissure blanche = normale, verte/noire = problème.\n• Si humidité > 75 % : ajouter des bacs de sel autour du jambon et augmenter la ventilation.\n• Si humidité < 60 % : ajouter un linge humide sans contact avec le jambon et réduire la ventilation.\n• Fumage : hêtre, chêne, pommier, cerisier — jamais de résineux.",
    "description": "Programme complet pour fabriquer un jambon cru entier avec os (8 à 12 kg) : parage, salage au gros sel non iodé (1,5 à 2 j/kg), repos et fumage facultatifs, poivrage, séchage et affinage long.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Traditionnel au poivre",
        "descriptionEpices": "Couche de poivre moulu sur les zones maigres (ne pas poivrer la couenne)",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Fumé à froid",
        "descriptionEpices": "Poivre + fumage à froid 12 à 48h (20-28°C max, bois non résineux)",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Jambon frais entier avec os (8 à 12 kg)",
        "nom": "Jambon frais entier avec os (8 à 12 kg)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 9.5,
        "prix": 9.5
      },
      {
        "nomIngredient": "Gros sel non iodé (enfouissement)",
        "nom": "Gros sel non iodé (enfouissement)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 1,
        "prix": 1
      },
      {
        "nomIngredient": "Poivre moulu",
        "nom": "Poivre moulu",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 10,
        "qte": 10,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "1. Choix & Préparation initiale",
        "instructions": "• Jambon frais entier avec os, 8 à 12 kg.\n• Parer légèrement le jambon (retirer excès de gras irrégulier).\n• Désinfecter le matériel et l'espace de travail.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "2. Salage au gros sel (1,5 à 2 jours / kg à 1-4 °C)",
        "instructions": "• Utiliser du gros sel non iodé.\n• Masser vigoureusement le jambon (insister sur les creux et zones proches de l'os).\n• Recouvrir entièrement de sel dans un bac entre 1 et 4 °C.\n• Retourner le jambon tous les 2 jours et rajouter du sel si nécessaire.",
        "astuce": "",
        "offsetDebutMinutes": 60,
        "dureeMinutes": 25920,
        "dureeH": 432,
        "varianteCible": null,
        "modeDuree": "PAR_KG",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "3. Sortie de sel & Retournements réguliers (tous les 2 jours)",
        "instructions": "Rappel intermédiaire : vérifier le jambon au sel, retourner tous les 2 jours et compléter le sel.",
        "astuce": "",
        "offsetDebutMinutes": 2880,
        "dureeMinutes": 15,
        "dureeH": 0.25,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "4. Repos post-salage (Facultatif : 2 à 3 semaines à 4-8 °C)",
        "instructions": "• Permet au sel de migrer uniformément et stabilise l'humidité interne.\n• Placer entre 4 et 8 °C pendant 2 à 3 semaines sans ventilation excessive (peut être sauté si salage de 1,5 à 2 j/kg).",
        "astuce": "",
        "offsetDebutMinutes": 25980,
        "dureeMinutes": 20160,
        "dureeH": 336,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": true
      },
      {
        "ordre": 5,
        "titre": "5. Fumage à froid (Facultatif : 12 à 48 h à 20-28 °C max)",
        "instructions": "• Fumage à froid uniquement (20 à 28 °C max) pendant 12 à 48 h.\n• Bois : hêtre, chêne, pommier, cerisier (jamais de résineux).",
        "astuce": "",
        "offsetDebutMinutes": 26000,
        "dureeMinutes": 1440,
        "dureeH": 24,
        "varianteCible": "Fumé à froid",
        "modeDuree": "FIXE",
        "facultative": true
      },
      {
        "ordre": 6,
        "titre": "6. Application du poivre",
        "instructions": "• Retirer le sel et brosser légèrement le jambon.\n• Appliquer une couche de poivre moulu sur les zones maigres (ne pas poivrer la couenne). Agit comme protection contre insectes et moisissures.",
        "astuce": "",
        "offsetDebutMinutes": 26100,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 7,
        "titre": "7. Séchage (1 à 3 mois à 10-15 °C, 70-80 % HR)",
        "instructions": "• Suspendre dans un meuble moustiquaire ou espace ventilé.\n• Conditions idéales : 10 à 15 °C, 70 à 80 % d'humidité pour une perte d'eau progressive.",
        "astuce": "",
        "offsetDebutMinutes": 86400,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 8,
        "titre": "8. Affinage (9 à 18 mois à 12-18 °C, 60-70 % HR)",
        "instructions": "• Affinage long entre 12 et 18 °C, 60 à 70 % HR.\n• Surveiller les moisissures (blanche = normale, verte/noire = problème).\n• Contrôle final : odeur agréable, texture ferme, trancher finement.",
        "astuce": "",
        "offsetDebutMinutes": 432000,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "PATE_SANGLIER",
    "code": "PATE_SANGLIER",
    "nom": "Pâté de sanglier (Ma recette)",
    "famille": "Gibier & Foie",
    "typeRecette": "MELEE",
    "type": "MELEE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1,
    "perteCiblePct": 0,
    "perteCible": 0,
    "tempCoeurCible": 100,
    "conditionsConservation": "Conserve stérilisée 2 h à 100 °C : plusieurs années au frais et à l'abri de la lumière (attendre 2-3 semaines avant dégustation).",
    "pointsVigilance": "Pour 1 kg de sanglier : 700 g de gorge/poitrine de porc (soit 1,7 kg de pâté au total). Le sel (16 g/kg) et le poivre (4 g/kg) se calculent sur le poids total de pâté ! Bien essuyer le bord des bocaux avant stérilisation.",
    "description": "Recette personnelle de pâté de sanglier : pour 1 kg de sanglier, 700 g de gorge/poitrine de porc, 3 à 4 échalotes, 2 oignons, thym, romarin, persil haché, 16 g de sel/kg de pâté et 4 g de poivre/kg de pâté. Stérilisation 2 h à l'ébullition.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Classique (Thym, Romarin, Persil)",
        "descriptionEpices": "Échalotes, oignons, thym, romarin, persil haché, 16g sel/kg pâté, 4g poivre/kg pâté",
        "epicesGrammesParUnite": 4,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Genièvre & Armagnac",
        "descriptionEpices": "Ajout de baies de genièvre concassées et 2 cl d'Armagnac",
        "epicesGrammesParUnite": 6,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Châtaignes / Noisettes",
        "descriptionEpices": "Ajout de 80 g de châtaignes ou noisettes torréfiées par kg",
        "epicesGrammesParUnite": 4,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Sanglier dénervé (base 1 kg)",
        "nom": "Sanglier dénervé (base 1 kg)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 0,
        "prix": 0
      },
      {
        "nomIngredient": "Gorge / poitrine de porc (700g / kg sanglier)",
        "nom": "Gorge / poitrine de porc (700g / kg sanglier)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 700,
        "qte": 700,
        "unite": "g",
        "prixKgOuUniteEstime": 8.5,
        "prix": 8.5
      },
      {
        "nomIngredient": "Échalotes (3 à 4 par kg de sanglier)",
        "nom": "Échalotes (3 à 4 par kg de sanglier)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 3.5,
        "qte": 3.5,
        "unite": "pièce",
        "prixKgOuUniteEstime": 0.25,
        "prix": 0.25
      },
      {
        "nomIngredient": "Oignons (2 par kg de sanglier)",
        "nom": "Oignons (2 par kg de sanglier)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 2,
        "qte": 2,
        "unite": "pièce",
        "prixKgOuUniteEstime": 0.3,
        "prix": 0.3
      },
      {
        "nomIngredient": "Sel (16 g par kg de pâté, soit 27,2 g pour 1,7 kg)",
        "nom": "Sel (16 g par kg de pâté, soit 27,2 g pour 1,7 kg)",
        "modeCalcul": "PAR_KG_MELEE",
        "quantite": 27.2,
        "qte": 27.2,
        "unite": "g",
        "prixKgOuUniteEstime": 1.5,
        "prix": 1.5
      },
      {
        "nomIngredient": "Poivre (4 g par kg de pâté, soit 6,8 g pour 1,7 kg)",
        "nom": "Poivre (4 g par kg de pâté, soit 6,8 g pour 1,7 kg)",
        "modeCalcul": "PAR_KG_MELEE",
        "quantite": 6.8,
        "qte": 6.8,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      },
      {
        "nomIngredient": "Thym, Romarin, Persil haché",
        "nom": "Thym, Romarin, Persil haché",
        "modeCalcul": "AU_GOUT",
        "quantite": 1,
        "qte": 1,
        "unite": "bouquet",
        "prixKgOuUniteEstime": 1.5,
        "prix": 1.5
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Découpe & Hachage (Sanglier + Gorge/Poitrine)",
        "instructions": "• Pour 1 kg de sanglier, peser 700 g de gorge/poitrine de porc (soit 1,7 kg de mêlée).\n• Hacher les viandes (grille 6 ou 8 mm).\n• Émincer finement les 3 à 4 échalotes, les 2 oignons et le persil.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Assaisonnement & Mêlée (16g sel / 4g poivre par kg de pâté)",
        "instructions": "• Peser le poids total de pâté obtenu.\n• Ajouter 16 g de sel par kg de pâté et 4 g de poivre par kg de pâté.\n• Incorporer échalotes, oignons, thym, romarin et persil haché. Malaxer vigoureusement 5 à 10 min.",
        "astuce": "",
        "offsetDebutMinutes": 45,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Mise en bocaux",
        "instructions": "• Tasser en bocaux propres en chassant les bulles d'air (laisser 2 cm de vide sous le bord).\n• Essuyer parfaitement les bords des bocaux et fermer hermétiquement.",
        "astuce": "",
        "offsetDebutMinutes": 75,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Stérilisation (2 h à partir de l'ébullition)",
        "instructions": "• Placer les bocaux calés dans le stérilisateur, couvrir d'eau.\n• Cuire 2 heures à 100 °C à partir de l'ébullition franche.\n• Laisser refroidir dans l'eau.",
        "astuce": "",
        "offsetDebutMinutes": 105,
        "dureeMinutes": 120,
        "dureeH": 2,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "JAMBON_BLANC",
    "code": "JAMBON_BLANC",
    "nom": "Jambon blanc maison",
    "famille": "Porc",
    "typeRecette": "CUIT",
    "type": "CUIT",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 2.5,
    "perteCiblePct": 0,
    "perteCible": 0,
    "tempCoeurCible": 68,
    "conditionsConservation": "Réfrigérateur 2-4 °C : 1 semaine (ou tranché sous vide)",
    "pointsVigilance": "Injection de saumure à 12-15% du poids de la viande. Cuisson douce dans l'eau à 70-75 °C et arrêt strict à 68 °C à cœur, suivi d'un bain d'eau glacée.",
    "description": "Jambon cuit artisanal par saumurage (injection + immersion) et cuisson basse température à 68 °C à cœur.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Nature au bouillon",
        "descriptionEpices": "Décoction laurier, thym, girofle, genièvre, ail, oignon",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Aux herbes",
        "descriptionEpices": "Enrobage persil, ciboulette et estragon avant moulage",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Fumé (Jambon fumé)",
        "descriptionEpices": "Fumage à froid 5 h avant cuisson",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Noix de jambon ou épaule désossée",
        "nom": "Noix de jambon ou épaule désossée",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 11,
        "prix": 11
      },
      {
        "nomIngredient": "Sel nitrité (110 g/L de saumure)",
        "nom": "Sel nitrité (110 g/L de saumure)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 55,
        "qte": 55,
        "unite": "g",
        "prixKgOuUniteEstime": 4.5,
        "prix": 4.5
      },
      {
        "nomIngredient": "Sucre / Dextrose (15 g/L de saumure)",
        "nom": "Sucre / Dextrose (15 g/L de saumure)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 8,
        "qte": 8,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Préparation de la saumure & refroidissement",
        "instructions": "Bouillir l'eau avec 110 g/L de sel nitrité, 15 g/L de sucre et les aromates. Refroidir complètement à 4 °C.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 120,
        "dureeH": 2,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Injection (12-15% du poids) & Immersion (48 h)",
        "instructions": "Injecter la saumure à cœur à la seringue, puis immerger la viande dans le reste de saumure pendant 48 h à 2-4 °C (retourner chaque jour).",
        "astuce": "",
        "offsetDebutMinutes": 120,
        "dureeMinutes": 2880,
        "dureeH": 48,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Rincage & Moulage / Ficelage",
        "instructions": "Rincer brièvement, éponger et serrer en moule à jambon ou filet de cuisson.",
        "astuce": "",
        "offsetDebutMinutes": 3000,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Cuisson douce à 68 °C à cœur",
        "instructions": "Pocher dans une eau à 72 °C jusqu'à atteindre exactement 68 °C à cœur à la sonde (~1h/kg).",
        "astuce": "",
        "offsetDebutMinutes": 3030,
        "dureeMinutes": 180,
        "dureeH": 3,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 5,
        "titre": "Refroidissement glacé & Repos 24 h",
        "instructions": "Plonger en eau glacée puis laisser 24 h au réfrigérateur sous presse avant de trancher.",
        "astuce": "",
        "offsetDebutMinutes": 3210,
        "dureeMinutes": 1440,
        "dureeH": 24,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "COPPA",
    "code": "COPPA",
    "nom": "Coppa maison (Échine séchée)",
    "famille": "Porc",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 2,
    "perteCiblePct": 35,
    "perteCible": 35,
    "tempCoeurCible": null,
    "conditionsConservation": "Salage sous vide à 3-4 °C (12 j) puis séchage à 12-14 °C et 75-80 % HR jusqu'à 35-40 % de perte.",
    "pointsVigilance": "Salage précis au gramme sous vide (3% sel, 1% sucre). Pas de risque de sursalage.",
    "description": "Échine de porc salée sous vide à l'équilibre puis affinée jusqu'à 35 % de perte de poids.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Traditionnelle Poivre & Genièvre",
        "descriptionEpices": "Poivre noir concassé, genièvre, laurier, ail",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Piment d'Espelette",
        "descriptionEpices": "Enrobage généreux au piment d'Espelette après salage",
        "epicesGrammesParUnite": 12,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Fenouil & Vin rouge",
        "descriptionEpices": "Graines de fenouil et massage au vin rouge",
        "epicesGrammesParUnite": 12,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Échine de porc désossée",
        "nom": "Échine de porc désossée",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 10.5,
        "prix": 10.5
      },
      {
        "nomIngredient": "Sel nitrité / sel fin (3%)",
        "nom": "Sel nitrité / sel fin (3%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 30,
        "qte": 30,
        "unite": "g",
        "prixKgOuUniteEstime": 4.5,
        "prix": 4.5
      },
      {
        "nomIngredient": "Sucre / Cassonade (1%)",
        "nom": "Sucre / Cassonade (1%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 10,
        "qte": 10,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      },
      {
        "nomIngredient": "Poivre & épices (0,8%)",
        "nom": "Poivre & épices (0,8%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 8,
        "qte": 8,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Parage, Pesée & Salage sous vide (12 jours)",
        "instructions": "Peser l'échine au gramme près. Frotter avec les 3% de sel, 1% de sucre et épices. Mettre sous vide au frigo (3-4 °C) pour 12 jours en retournant tous les 2 jours.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 17280,
        "dureeH": 288,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage, Séchage, Épiçage & Ficelage / Boyau",
        "instructions": "Rincer à l'eau froide, bien sécher, poivrer/épicer, embosser en chaudin ou ficeler serré. Noter le poids de départ du séchage !",
        "astuce": "",
        "offsetDebutMinutes": 17280,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Séchage jusqu'à 35 % de perte de poids (4 à 8 semaines)",
        "instructions": "Suspendre à 12-14 °C (75% HR). Peser chaque semaine jusqu'à atteindre 35% de perte.",
        "astuce": "",
        "offsetDebutMinutes": 57600,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "GUANCIALE",
    "code": "GUANCIALE",
    "nom": "Guanciale (Joue de porc séchée)",
    "famille": "Porc",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1.5,
    "perteCiblePct": 30,
    "perteCible": 30,
    "tempCoeurCible": null,
    "conditionsConservation": "12-15 °C, 70-80 % HR",
    "pointsVigilance": "Le gras sèche plus lentement que le maigre : viser 30 % de perte de poids.",
    "description": "Joue ou gorge de porc salée à 3% avec poivre noir concassé, thym et romarin.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Classique Poivre Noir & Romarin",
        "descriptionEpices": "Croûte épaisse de poivre noir concassé",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Pimenté (Peperoncino)",
        "descriptionEpices": "Poivre noir et piment concassé",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Joue de porc parée",
        "nom": "Joue de porc parée",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 8.5,
        "prix": 8.5
      },
      {
        "nomIngredient": "Sel (3%)",
        "nom": "Sel (3%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 30,
        "qte": 30,
        "unite": "g",
        "prixKgOuUniteEstime": 1.5,
        "prix": 1.5
      },
      {
        "nomIngredient": "Sucre (1%)",
        "nom": "Sucre (1%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 10,
        "qte": 10,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      },
      {
        "nomIngredient": "Poivre noir concassé (1,5%)",
        "nom": "Poivre noir concassé (1,5%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 15,
        "qte": 15,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Salage sous vide (10 à 14 jours)",
        "instructions": "Parer les glandes, frotter avec sel (3%), sucre (1%), ail et romarin. Mettre sous vide 12 jours au frigo en massant tous les 2 jours.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 17280,
        "dureeH": 288,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage & Croûtage au poivre",
        "instructions": "Rincer, sécher et enrober généreusement de poivre noir concassé. Noter le poids initial.",
        "astuce": "",
        "offsetDebutMinutes": 17280,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Séchage jusqu'à 30 % de perte (4 à 8 semaines)",
        "instructions": "Suspendre au séchoir ou bas du frigo jusqu'à 30% de perte de poids.",
        "astuce": "",
        "offsetDebutMinutes": 57600,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "POITRINE_FUMEE",
    "code": "POITRINE_FUMEE",
    "nom": "Poitrine fumée, Lardons & Pancetta",
    "famille": "Porc",
    "typeRecette": "FUME",
    "type": "FUME",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 2,
    "perteCiblePct": 20,
    "perteCible": 20,
    "tempCoeurCible": null,
    "conditionsConservation": "Sous vide au réfrigérateur (plusieurs semaines) ou congelé en sachets de lardons.",
    "pointsVigilance": "Bien former la pellicule sèche (24-48h à découvert au frigo) avant le fumage à froid, sinon la fumée donnera de l'âcreté. Cuire les lardons avant consommation.",
    "description": "Poitrine de porc salée sous vide puis fumée à froid (pour tranches et lardons) ou roulée et séchée (variante Pancetta).",
    "masquee": false,
    "sortiesDecoupe": [
      {
        "codeSortie": "lardons",
        "nom": "Sachets de Lardons (200 g)",
        "unite": "sachet",
        "rendementParUniteBase": 3,
        "valeurRefBoutiqueUnitaire": 3.8,
        "fraisTransfoUnitaire": 0.25,
        "cocheParDefaut": true
      },
      {
        "codeSortie": "tranches_bacon",
        "nom": "Poitrine tranchée",
        "unite": "kg",
        "rendementParUniteBase": 0.35,
        "valeurRefBoutiqueUnitaire": 19,
        "fraisTransfoUnitaire": 0.5,
        "cocheParDefaut": true
      },
      {
        "codeSortie": "couenne",
        "nom": "Couenne & Talons (pour bouillons/lentilles)",
        "unite": "kg",
        "rendementParUniteBase": 0.1,
        "valeurRefBoutiqueUnitaire": 5,
        "fraisTransfoUnitaire": 0.1,
        "cocheParDefaut": true
      }
    ],
    "variantes": [
      {
        "nom": "Fumée au hêtre (Tranches & Lardons)",
        "descriptionEpices": "Poivre, genièvre, laurier + 20h de fumage à froid",
        "epicesGrammesParUnite": 8,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      },
      {
        "nom": "Pancetta roulée (non fumée)",
        "descriptionEpices": "Poivre, herbes, roulée serrée et séchée jusqu'à 30% de perte",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Érable & Poivre (Style Bacon)",
        "descriptionEpices": "Cassonade/sirop d'érable + poivre + fumage",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Poitrine de porc fraîche",
        "nom": "Poitrine de porc fraîche",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 9,
        "prix": 9
      },
      {
        "nomIngredient": "Sel nitrité / sel fin (3%)",
        "nom": "Sel nitrité / sel fin (3%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 30,
        "qte": 30,
        "unite": "g",
        "prixKgOuUniteEstime": 4.5,
        "prix": 4.5
      },
      {
        "nomIngredient": "Sucre cassonade (1,5%)",
        "nom": "Sucre cassonade (1,5%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 15,
        "qte": 15,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      },
      {
        "nomIngredient": "Poivre, genièvre, laurier",
        "nom": "Poivre, genièvre, laurier",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 8,
        "qte": 8,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Salage sous vide (7 jours)",
        "instructions": "Masser la poitrine avec les 3% de sel, 1,5% de sucre et épices. Mettre sous vide 7 jours au frigo (retourner chaque jour).",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 10080,
        "dureeH": 168,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage & Formation de la pellicule (24 h à découvert)",
        "instructions": "Rincer à l'eau froide, bien sécher et laisser 24 h sur une grille à découvert au frigo pour former la pellicule sèche.",
        "astuce": "",
        "offsetDebutMinutes": 10080,
        "dureeMinutes": 1440,
        "dureeH": 24,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Fumage à froid (2 x 10 h)",
        "instructions": "Fumer à froid (< 25 °C) à la sciure de hêtre pendant 2 sessions de 10-12 h.",
        "astuce": "",
        "offsetDebutMinutes": 11520,
        "dureeMinutes": 1200,
        "dureeH": 20,
        "varianteCible": "Fumée au hêtre (Tranches & Lardons)",
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Repos 48 h & Découpe en Lardons / Tranches",
        "instructions": "Laisser reposer 48 h sous vide pour harmoniser la fumée, puis découper en tranches et en sachets de lardons de 200 g.",
        "astuce": "",
        "offsetDebutMinutes": 14400,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "BOEUF_SECHE",
    "code": "BOEUF_SECHE",
    "nom": "Bœuf séché (Bresaola)",
    "famille": "Bœuf",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1.5,
    "perteCiblePct": 38,
    "perteCible": 38,
    "tempCoeurCible": null,
    "conditionsConservation": "Séchage à 12-15 °C (70-80 % HR) jusqu'à 35-40 % de perte.",
    "pointsVigilance": "Bien dégraisser et dénerver le rond de gîte ou la noix de bœuf.",
    "description": "Bœuf séché aux baies de genièvre, poivre, romarin et laurier.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Classique Genièvre & Laurier",
        "descriptionEpices": "Baies de genièvre concassées, poivre noir, thym, romarin",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Au Vin Rouge",
        "descriptionEpices": "Marinade sous vide avec un trait de vin rouge corsé et ail",
        "epicesGrammesParUnite": 12,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Poivre & Café",
        "descriptionEpices": "Croûte poivre noir et café torréfié",
        "epicesGrammesParUnite": 12,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Rond de gîte / Noix de bœuf paré",
        "nom": "Rond de gîte / Noix de bœuf paré",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 22,
        "prix": 22
      },
      {
        "nomIngredient": "Sel nitrité / sel fin (3%)",
        "nom": "Sel nitrité / sel fin (3%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 30,
        "qte": 30,
        "unite": "g",
        "prixKgOuUniteEstime": 4.5,
        "prix": 4.5
      },
      {
        "nomIngredient": "Sucre (1,5%)",
        "nom": "Sucre (1,5%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 15,
        "qte": 15,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      },
      {
        "nomIngredient": "Genièvre, poivre, romarin (0,8%)",
        "nom": "Genièvre, poivre, romarin (0,8%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 8,
        "qte": 8,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Salage sous vide (10 jours)",
        "instructions": "Masser la pièce de bœuf avec sel (3%), sucre (1,5%) et aromates. Mettre sous vide 10 jours au frigo en retournant chaque jour.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 14400,
        "dureeH": 240,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage, Séchage & Ficelage",
        "instructions": "Rincer, sécher soigneusement, ficeler ou embosser et noter le poids initial.",
        "astuce": "",
        "offsetDebutMinutes": 14400,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Séchage jusqu'à 38 % de perte (4 à 8 semaines)",
        "instructions": "Affiner à 12-15 °C (75% HR) ou au bas du frigo en torchon jusqu'à 35-40% de perte.",
        "astuce": "",
        "offsetDebutMinutes": 57600,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "GRAVLAX_SAUMON",
    "code": "GRAVLAX_SAUMON",
    "nom": "Gravlax de saumon (& variante Fumé)",
    "famille": "Poisson",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1,
    "perteCiblePct": 0,
    "perteCible": 0,
    "tempCoeurCible": null,
    "conditionsConservation": "3 à 5 jours au réfrigérateur (ou tranché sous vide au congélateur).",
    "pointsVigilance": "Sécurité Anisakis : congeler le poisson pendant 7 jours au congélateur domestique avant ou après préparation (sauf saumon déjà surgelé).",
    "description": "Filet de saumon mariné au gros sel, sucre et aneth frais pendant 48 h.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Classique Aneth & Baies roses",
        "descriptionEpices": "Aneth frais ciselé, baies roses, poivre, zeste de citron",
        "epicesGrammesParUnite": 20,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Betterave & Agrumes",
        "descriptionEpices": "Betterave crue râpée pour une robe pourpre + zestes d'orange",
        "epicesGrammesParUnite": 150,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Saumon fumé à froid",
        "descriptionEpices": "Salage court 8h + pellicule 12h + fumage à froid 6h au hêtre",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 8,
        "ajouteEtapeFumage": true
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Filet de saumon avec peau désarêté",
        "nom": "Filet de saumon avec peau désarêté",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 24,
        "prix": 24
      },
      {
        "nomIngredient": "Gros sel (10% à 15%)",
        "nom": "Gros sel (10% à 15%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 120,
        "qte": 120,
        "unite": "g",
        "prixKgOuUniteEstime": 1,
        "prix": 1
      },
      {
        "nomIngredient": "Sucre en poudre (10% à 15%)",
        "nom": "Sucre en poudre (10% à 15%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 120,
        "qte": 120,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      },
      {
        "nomIngredient": "Aneth frais & baies roses",
        "nom": "Aneth frais & baies roses",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 2,
        "qte": 2,
        "unite": "bouquet",
        "prixKgOuUniteEstime": 1.5,
        "prix": 1.5
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Marinade sous presse (48 h au frigo)",
        "instructions": "Recouvrir le filet du mélange gros sel + sucre + aneth. Filmer sous un léger poids au frigo pendant 48 h en vidant le jus toutes les 24 h.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 2880,
        "dureeH": 48,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage, Séchage & Tranchage",
        "instructions": "Rincer à l'eau froide, bien sécher au papier absorbant, parsemer d'aneth frais et trancher finement.",
        "astuce": "",
        "offsetDebutMinutes": 2880,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "GRAVLAX_BOEUF",
    "code": "GRAVLAX_BOEUF",
    "nom": "Gravlax de bœuf (Filet confit au sel)",
    "famille": "Bœuf",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 0.7,
    "perteCiblePct": 0,
    "perteCible": 0,
    "tempCoeurCible": null,
    "conditionsConservation": "3 à 5 jours au réfrigérateur bien filmé.",
    "pointsVigilance": "24 h pour un cœur très fondant type carpaccio, 36 à 48 h pour une texture plus ferme.",
    "description": "Filet de bœuf mariné à froid dans un mélange 2/3 gros sel et 1/3 sucre avec herbes et épices.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Thym, Romarin & Poivre",
        "descriptionEpices": "Herbes fraîches, baies de genièvre et poivre concassé",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Asiatique (Gingembre, Soja, Citron vert)",
        "descriptionEpices": "Gingembre râpé, zeste de citron vert, coriandre",
        "epicesGrammesParUnite": 20,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Filet de bœuf paré",
        "nom": "Filet de bœuf paré",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 38,
        "prix": 38
      },
      {
        "nomIngredient": "Gros sel",
        "nom": "Gros sel",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 250,
        "qte": 250,
        "unite": "g",
        "prixKgOuUniteEstime": 1,
        "prix": 1
      },
      {
        "nomIngredient": "Sucre",
        "nom": "Sucre",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 125,
        "qte": 125,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Enrobage Sel/Sucre/Épices (24 à 36 h)",
        "instructions": "Enfouir le filet de bœuf dans le mélange gros sel, sucre et aromates. Filmer et réfrigérer 24 à 36 h (retourner à mi-parcours).",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 1800,
        "dureeH": 30,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage, Séchage & Croûte de poivre",
        "instructions": "Rincer sous l'eau froide, sécher soigneusement et trancher très finement.",
        "astuce": "",
        "offsetDebutMinutes": 1800,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "FOIE_GRAS",
    "code": "FOIE_GRAS",
    "nom": "Foie gras maison (Mi-cuit / Bocal / Torchon)",
    "famille": "Gibier & Foie",
    "typeRecette": "CUIT",
    "type": "CUIT",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1,
    "perteCiblePct": 0,
    "perteCible": 0,
    "tempCoeurCible": 58,
    "conditionsConservation": "Mi-cuit en bocal : 3 à 6 mois au frigo (4 °C). Conserve stérilisée : plusieurs années.",
    "pointsVigilance": "Sortir le foie 1 à 2 h avant pour le déveiner souple. Pour le mi-cuit, ne pas dépasser 57-60 °C à cœur, puis plonger dans l'eau glacée. Attendre 48-72 h avant dégustation.",
    "description": "Foie gras assaisonné au gramme près (11 g de sel, 3 g de poivre, 1 g de sucre par kg).",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Mi-cuit en bocal (Armagnac)",
        "descriptionEpices": "11g sel/kg, 3g poivre blanc, 1g sucre, 2 cl Armagnac (cuisson 58°C à cœur)",
        "epicesGrammesParUnite": 4,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Mi-cuit Sauternes / Porto",
        "descriptionEpices": "11g sel/kg, 3g poivre, 2 cl Sauternes ou Porto",
        "epicesGrammesParUnite": 4,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Conserve stérilisée (100 °C)",
        "descriptionEpices": "Stérilisation 1h30 à 100 °C pour garde longue",
        "epicesGrammesParUnite": 4,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Foie gras cru déveiné",
        "nom": "Foie gras cru déveiné",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 48,
        "prix": 48
      },
      {
        "nomIngredient": "Sel fin (11 g/kg)",
        "nom": "Sel fin (11 g/kg)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 11,
        "qte": 11,
        "unite": "g",
        "prixKgOuUniteEstime": 1.5,
        "prix": 1.5
      },
      {
        "nomIngredient": "Poivre blanc moulu (3 g/kg)",
        "nom": "Poivre blanc moulu (3 g/kg)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 3,
        "qte": 3,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      },
      {
        "nomIngredient": "Sucre (1 g/kg)",
        "nom": "Sucre (1 g/kg)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1,
        "qte": 1,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Tempérage, Déveinage & Assaisonnement (Repos 12 h)",
        "instructions": "Sortir le foie 1 h avant, séparer les lobes et retirer les veines. Assaisonner (11g sel, 3g poivre, 1g sucre, alcool) et laisser reposer 12 h au frigo.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 720,
        "dureeH": 12,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Mise en bocaux & Cuisson (58 °C à cœur)",
        "instructions": "Tasser en bocaux (2 cm de vide). Cuire au bain-marie à 80-85 °C pendant 35-45 min jusqu'à 58 °C à cœur. Plonger en eau glacée.",
        "astuce": "",
        "offsetDebutMinutes": 720,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Maturation au frais (48 à 72 h)",
        "instructions": "Attendre au moins 48 à 72 h au réfrigérateur avant de déguster.",
        "astuce": "",
        "offsetDebutMinutes": 3600,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "RILLETTES_PORC",
    "code": "RILLETTES_PORC",
    "nom": "Rillettes de porc maison",
    "famille": "Porc",
    "typeRecette": "CUIT",
    "type": "CUIT",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 2,
    "perteCiblePct": 0,
    "perteCible": 0,
    "tempCoeurCible": null,
    "conditionsConservation": "En pots sous couche de saindoux (3 semaines au frigo) ou bocaux stérilisés 2 h à 100 °C.",
    "pointsVigilance": "Cuisson très lente (4 à 6 h) à feu très doux. 15 g de sel et 2 g de poivre par kg.",
    "description": "Rillettes fondantes (40% échine, 30% poitrine, 30% épaule + saindoux).",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Traditionnelle du Mans",
        "descriptionEpices": "Sel 15g/kg, poivre 2g/kg, laurier, thym",
        "epicesGrammesParUnite": 2,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Mixte Porc & Canard",
        "descriptionEpices": "Cuisson dans la graisse de canard",
        "epicesGrammesParUnite": 2,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Échine + Poitrine + Épaule de porc",
        "nom": "Échine + Poitrine + Épaule de porc",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 9.5,
        "prix": 9.5
      },
      {
        "nomIngredient": "Sel fin (15 g/kg)",
        "nom": "Sel fin (15 g/kg)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 15,
        "qte": 15,
        "unite": "g",
        "prixKgOuUniteEstime": 1.5,
        "prix": 1.5
      },
      {
        "nomIngredient": "Poivre (2 g/kg)",
        "nom": "Poivre (2 g/kg)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 2,
        "qte": 2,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Découpe en dés & Rissolage",
        "instructions": "Couper la viande en dés de 3-4 cm. Faire rissoler 15 min en cocotte avec un fond d'eau ou de saindoux.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Confisage lent (5 h à feu très doux)",
        "instructions": "Ajouter sel (15g/kg), poivre (2g/kg) et bouquet garni. Cuire 4 à 6 h à couvert à feu très doux.",
        "astuce": "",
        "offsetDebutMinutes": 30,
        "dureeMinutes": 300,
        "dureeH": 5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Effilochage & Mise en bocaux / Stérilisation",
        "instructions": "Effilocher à la fourchette, mettre en pots ou stériliser 2 h à 100 °C.",
        "astuce": "",
        "offsetDebutMinutes": 330,
        "dureeMinutes": 120,
        "dureeH": 2,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "SAUCISSE_FRAICHE",
    "code": "SAUCISSE_FRAICHE",
    "nom": "Saucisses fraîches (Mêlée commune + Variantes)",
    "famille": "Porc",
    "typeRecette": "MELEE",
    "type": "MELEE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 3,
    "perteCiblePct": 0,
    "perteCible": 0,
    "tempCoeurCible": null,
    "conditionsConservation": "48 à 72 h au réfrigérateur ou congélation immédiate sous vide.",
    "pointsVigilance": "Placer la viande et le hachoir 30 min au congélateur avant hachage. Base commune : 70% maigre / 30% gras, 18 g de sel/kg, puis séparation en lots pour les variantes (Nature, Herbes, Toulouse, Espelette, Comté...).",
    "description": "Une seule mêlée de base (épaule + poitrine 70/30, 18 g de sel/kg), déclinée en plusieurs lots aromatisés.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Nature",
        "descriptionEpices": "Base sel 18g/kg + poivre noir 2,5g/kg",
        "epicesGrammesParUnite": 2.5,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Herbes fraîches",
        "descriptionEpices": "+15 g/kg de persil plat et ciboulette finement ciselés",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Toulouse (Ail & Vin blanc)",
        "descriptionEpices": "+2 gousses d'ail/kg, muscade et trait de vin blanc sec",
        "epicesGrammesParUnite": 5,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Herbes de Provence",
        "descriptionEpices": "+3 g/kg d'herbes de Provence et pointe d'ail",
        "epicesGrammesParUnite": 4,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Piment d'Espelette",
        "descriptionEpices": "+3 g/kg de piment d'Espelette",
        "epicesGrammesParUnite": 3,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Comté & Vin blanc",
        "descriptionEpices": "+50 g/kg de petits dés de Comté",
        "epicesGrammesParUnite": 50,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Épaule de porc maigre (70%)",
        "nom": "Épaule de porc maigre (70%)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 700,
        "qte": 700,
        "unite": "g",
        "prixKgOuUniteEstime": 10,
        "prix": 10
      },
      {
        "nomIngredient": "Poitrine ou gorge de porc (30%)",
        "nom": "Poitrine ou gorge de porc (30%)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 300,
        "qte": 300,
        "unite": "g",
        "prixKgOuUniteEstime": 8.5,
        "prix": 8.5
      },
      {
        "nomIngredient": "Sel fin (18 g/kg)",
        "nom": "Sel fin (18 g/kg)",
        "modeCalcul": "PAR_KG_MELEE",
        "quantite": 18,
        "qte": 18,
        "unite": "g",
        "prixKgOuUniteEstime": 1.5,
        "prix": 1.5
      },
      {
        "nomIngredient": "Poivre noir moulu (2,5 g/kg)",
        "nom": "Poivre noir moulu (2,5 g/kg)",
        "modeCalcul": "PAR_KG_MELEE",
        "quantite": 2.5,
        "qte": 2.5,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      },
      {
        "nomIngredient": "Boyau naturel de porc 26/28",
        "nom": "Boyau naturel de porc 26/28",
        "modeCalcul": "PAR_KG_MELEE",
        "quantite": 1.5,
        "qte": 1.5,
        "unite": "m",
        "prixKgOuUniteEstime": 0.8,
        "prix": 0.8
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Passage au froid (30 min) & Trempage des boyaux",
        "instructions": "Placer la viande coupée en cubes et la tête du hachoir 30 min au congélateur. Faire tremper les boyaux dans de l'eau tiède.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Hachage & Pétrissage de la base commune",
        "instructions": "Hacher grille 6 ou 8 mm. Ajouter les 18 g/kg de sel, 2,5 g/kg de poivre et 40 ml/kg d'eau glacée. Pétrir 2 min jusqu'à ce que la mêlée colle.",
        "astuce": "",
        "offsetDebutMinutes": 30,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Séparation en lots (Nature, Herbes...) & Embossage",
        "instructions": "Diviser la mêlée selon vos lots, incorporer les herbes/épices de chaque variante, puis pousser en boyaux sans trop serrer.",
        "astuce": "",
        "offsetDebutMinutes": 60,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "SAUCISSE_SECHE",
    "code": "SAUCISSE_SECHE",
    "nom": "Saucisse sèche, Saucisson & Chorizo",
    "famille": "Porc",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 3,
    "perteCiblePct": 38,
    "perteCible": 38,
    "tempCoeurCible": null,
    "conditionsConservation": "Étuvage 24-48 h à 20-22 °C (80% HR), puis séchage à 12-15 °C (75-80% HR) jusqu'à 35-40% de perte.",
    "pointsVigilance": "Ne pas descendre sous 25 g de sel/kg. Utiliser du gras dur (bardière) bien froid pour ne pas graisser la mêlée.",
    "description": "Saucisse sèche et saucisson artisanal (75% maigre / 25% gras dur), déclinable en variante Chorizo au Pimentón.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Nature / Poivre",
        "descriptionEpices": "Poivre noir en grains et moulu, ail",
        "epicesGrammesParUnite": 5,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Noisettes",
        "descriptionEpices": "+50 g/kg de noisettes torréfiées concassées",
        "epicesGrammesParUnite": 50,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Chorizo (Pimentón de la Vera)",
        "descriptionEpices": "28 g/kg de Pimentón doux/fort, 6 g/kg d'ail frais, origan",
        "epicesGrammesParUnite": 35,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Herbes & Espelette",
        "descriptionEpices": "Herbes de Provence et piment d'Espelette",
        "epicesGrammesParUnite": 6,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Maigre de porc (75%)",
        "nom": "Maigre de porc (75%)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 750,
        "qte": 750,
        "unite": "g",
        "prixKgOuUniteEstime": 10.5,
        "prix": 10.5
      },
      {
        "nomIngredient": "Gras dur de bardière (25%)",
        "nom": "Gras dur de bardière (25%)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 250,
        "qte": 250,
        "unite": "g",
        "prixKgOuUniteEstime": 6,
        "prix": 6
      },
      {
        "nomIngredient": "Sel / Sel nitrité (27 g/kg)",
        "nom": "Sel / Sel nitrité (27 g/kg)",
        "modeCalcul": "PAR_KG_MELEE",
        "quantite": 27,
        "qte": 27,
        "unite": "g",
        "prixKgOuUniteEstime": 4.5,
        "prix": 4.5
      },
      {
        "nomIngredient": "Dextrose & Sucre (5 g/kg)",
        "nom": "Dextrose & Sucre (5 g/kg)",
        "modeCalcul": "PAR_KG_MELEE",
        "quantite": 5,
        "qte": 5,
        "unite": "g",
        "prixKgOuUniteEstime": 6,
        "prix": 6
      },
      {
        "nomIngredient": "Boyau menu de porc 32/34",
        "nom": "Boyau menu de porc 32/34",
        "modeCalcul": "PAR_KG_MELEE",
        "quantite": 2,
        "qte": 2,
        "unite": "m",
        "prixKgOuUniteEstime": 0.8,
        "prix": 0.8
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Hachage à froid & Pétrissage par lot",
        "instructions": "Hacher maigre et gras très froids (6-8 mm). Incorporer sel (27g/kg), sucres, ferments et les épices de chaque variante. Pétrir 5 min jusqu'à liaison collante.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Embossage serré & Piquage",
        "instructions": "Pousser fermement en boyaux sans poches d'air, ficeler, piquer et peser chaque lot.",
        "astuce": "",
        "offsetDebutMinutes": 60,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Étuvage (36 h à 20-22 °C, 80% HR)",
        "instructions": "Suspendre 24 à 48 h à 20-22 °C humide pour lancer la fermentation et l'égouttage.",
        "astuce": "",
        "offsetDebutMinutes": 105,
        "dureeMinutes": 2160,
        "dureeH": 36,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Séchage jusqu'à 35-40 % de perte (3 à 5 semaines)",
        "instructions": "Placer au séchoir à 12-15 °C (75-80% HR) et suivre les pesées chaque semaine.",
        "astuce": "",
        "offsetDebutMinutes": 30240,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "LONZO",
    "code": "LONZO",
    "nom": "Lonzo / Filet mignon séché",
    "famille": "Porc",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "pièce",
    "unite": "pièce",
    "quantiteDefaut": 2,
    "perteCiblePct": 33,
    "perteCible": 33,
    "tempCoeurCible": null,
    "conditionsConservation": "2 à 3 semaines en torchon au bas du réfrigérateur (30-35% de perte).",
    "pointsVigilance": "Salage rapide (12 h au gros sel pour un filet mignon de 500 g, ou sous vide à 3% pendant 6 j).",
    "description": "Filet mignon de porc séché, rapide et inratable.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Herbes de Provence & Poivre",
        "descriptionEpices": "Herbes de Provence et poivre noir",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 12,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Piment d'Espelette",
        "descriptionEpices": "Piment d'Espelette AOP",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 12,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Filet mignon de porc (~500 g)",
        "nom": "Filet mignon de porc (~500 g)",
        "modeCalcul": "PAR_PIECE",
        "quantite": 500,
        "qte": 500,
        "unite": "g",
        "prixKgOuUniteEstime": 13.5,
        "prix": 13.5
      },
      {
        "nomIngredient": "Gros sel non iodé",
        "nom": "Gros sel non iodé",
        "modeCalcul": "PAR_PIECE",
        "quantite": 500,
        "qte": 500,
        "unite": "g",
        "prixKgOuUniteEstime": 1,
        "prix": 1
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Salage 12 h au gros sel",
        "instructions": "Parer le filet mignon et l'enfouir 12 h dans le gros sel au réfrigérateur.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 720,
        "dureeH": 12,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage, Séchage & Épiçage",
        "instructions": "Rincer abondamment, bien sécher, enrober d'épices et rouler en torchon.",
        "astuce": "",
        "offsetDebutMinutes": 720,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Séchage 2 à 3 semaines (33 % de perte)",
        "instructions": "Laisser sécher au bas du frigo pendant 2 à 3 semaines.",
        "astuce": "",
        "offsetDebutMinutes": 25920,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "SANGLIER_SECHE",
    "code": "SANGLIER_SECHE",
    "nom": "Noix de sanglier séchée",
    "famille": "Gibier & Foie",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1.5,
    "perteCiblePct": 35,
    "perteCible": 35,
    "tempCoeurCible": null,
    "conditionsConservation": "Bas du réfrigérateur en torchon ou cave à 12-14 °C (75 % HR) pendant 4 à 8 semaines.",
    "pointsVigilance": "Bien dénerver et parer le morceau. Salage sous vide à l'équilibre (30 g sel/kg) pour une diffusion homogène sans risque de sursalage.",
    "description": "Salaison d'exception dans la noix ou le cuissot de sanglier, salée à l'équilibre avec genièvre, laurier et romarin, puis séchée lentement.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Genièvre & Baies des bois",
        "descriptionEpices": "Baies de genièvre concassées, poivre noir, laurier et romarin",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Fumé au bois de hêtre",
        "descriptionEpices": "Enrobage poivre noir puis fumage à froid 12 à 16 h",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Noix / Cuissot de sanglier dénervé",
        "nom": "Noix / Cuissot de sanglier dénervé",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 0,
        "prix": 0
      },
      {
        "nomIngredient": "Sel fin non iodé ou sel nitrité (3 %)",
        "nom": "Sel fin non iodé ou sel nitrité (3 %)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 30,
        "qte": 30,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      },
      {
        "nomIngredient": "Sucre / Cassonade (1 %)",
        "nom": "Sucre / Cassonade (1 %)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 10,
        "qte": 10,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      },
      {
        "nomIngredient": "Poivre noir & Baies de genièvre",
        "nom": "Poivre noir & Baies de genièvre",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 10,
        "qte": 10,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Parage méticuleux & Salage sous vide (12 jours)",
        "instructions": "Retirer toutes les aponévroses et membranes. Frotter avec le sel (30g/kg), sucre (10g/kg) et épices. Mettre sous vide au réfrigérateur (3 °C) pendant 12 jours en massant tous les 2 jours.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 17280,
        "dureeH": 288,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage & Séchage de surface",
        "instructions": "Rincer à l'eau fraîche, essuyer parfaitement avec un linge propre et laisser sécher 12 h à l'air frais.",
        "astuce": "",
        "offsetDebutMinutes": 17280,
        "dureeMinutes": 720,
        "dureeH": 12,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Fumage à froid (lot Fumé - 12h à 16h)",
        "instructions": "Fumer à froid (bois de hêtre ou chêne, < 24 °C) pendant 12 à 16 heures.",
        "astuce": "",
        "offsetDebutMinutes": 18000,
        "dureeMinutes": 840,
        "dureeH": 14,
        "varianteCible": "Fumé au bois de hêtre",
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Affinage & Séchage (4 à 8 semaines, perte cible 35 %)",
        "instructions": "Envelopper en torchon propre au réfrigérateur ou suspendre à 12-14 °C (75% HR) jusqu'à atteindre 35 % de perte de poids.",
        "astuce": "",
        "offsetDebutMinutes": 40320,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "TRUITE_SAUMON_FUME",
    "code": "TRUITE_SAUMON_FUME",
    "nom": "Saumon ou Truite fumée à froid",
    "famille": "Poisson",
    "typeRecette": "FUME",
    "type": "FUME",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1.2,
    "perteCiblePct": 12,
    "perteCible": 12,
    "tempCoeurCible": null,
    "conditionsConservation": "Réfrigérateur sous vide : 3 semaines, ou congélation tranché.",
    "pointsVigilance": "Température du fumoir impérativement < 22 °C (fumage à froid). Bien sécher le filet pour former la pellicule avant fumage.",
    "description": "Filet de poisson noble (saumon d'Écosse ou truite de rivière) salé au sel sec et cassonade, puis fumé à froid au bois de hêtre et d'aulne.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Hêtre traditionnel",
        "descriptionEpices": "Fumage doux pur hêtre",
        "epicesGrammesParUnite": 10,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      },
      {
        "nom": "Bois d'Aulne & Baies de genièvre",
        "descriptionEpices": "Sciure d'aulne et baies de genièvre écrasées dans la sciure",
        "epicesGrammesParUnite": 12,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Filet de saumon ou grande truite fraîche (avec peau)",
        "nom": "Filet de saumon ou grande truite fraîche (avec peau)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 24,
        "prix": 24
      },
      {
        "nomIngredient": "Gros sel de Guérande",
        "nom": "Gros sel de Guérande",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 700,
        "qte": 700,
        "unite": "g",
        "prixKgOuUniteEstime": 1.2,
        "prix": 1.2
      },
      {
        "nomIngredient": "Cassonade ou sucre roux",
        "nom": "Cassonade ou sucre roux",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 300,
        "qte": 300,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      },
      {
        "nomIngredient": "Sciure de hêtre ou aulne dépoussiérée",
        "nom": "Sciure de hêtre ou aulne dépoussiérée",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 300,
        "qte": 300,
        "unite": "g",
        "prixKgOuUniteEstime": 4,
        "prix": 4
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Désaretage & Salage au sel sec (6 à 8 h)",
        "instructions": "Retirer toutes les arêtes à la pince. Mélanger 70% sel et 30% cassonade. Recouvrir le filet pendant 6 à 8 h au frais selon l'épaisseur.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 420,
        "dureeH": 7,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage doux & Séchage (12 h au frais)",
        "instructions": "Rincer délicatement à l'eau froide sans abîmer la chair. Éponger et laisser sécher 12 h à l'air libre au réfrigérateur pour former une fine pellicule brillante.",
        "astuce": "",
        "offsetDebutMinutes": 420,
        "dureeMinutes": 720,
        "dureeH": 12,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Fumage à froid (8 à 12 h à < 20 °C)",
        "instructions": "Placer sur grille au fumoir. Allumer le serpentin de sciure. Fumer pendant 8 à 12 heures en veillant à ne jamais dépasser 20 °C.",
        "astuce": "",
        "offsetDebutMinutes": 1140,
        "dureeMinutes": 600,
        "dureeH": 10,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Maturation sous film 24 h à 48 h",
        "instructions": "Filmer hermétiquement au frais pendant 24 à 48 h avant de trancher finement : la fumée s'adoucit et diffuse harmonieusement dans toute l'épaisseur.",
        "astuce": "",
        "offsetDebutMinutes": 1740,
        "dureeMinutes": 1440,
        "dureeH": 24,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "POISSON_FUME_CHAUD",
    "code": "POISSON_FUME_CHAUD",
    "nom": "Maquereaux / Filets fumés à chaud",
    "famille": "Poisson",
    "typeRecette": "FUME",
    "type": "FUME",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1.5,
    "perteCiblePct": 0,
    "perteCible": 0,
    "tempCoeurCible": 65,
    "conditionsConservation": "Réfrigérateur 5 à 7 jours, délicieux tiède ou froid.",
    "pointsVigilance": "Cuisson douce entre 70 °C et 85 °C dans le fumoir. La chair doit rester fondante et juteuse.",
    "description": "Poisson entier ou filets saumurés puis fumés et cuits simultanément à la sciure de bois fruité et hêtre (65 °C à cœur).",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Poivre concassé & Thym",
        "descriptionEpices": "Enrobage généreux de poivre noir concassé et fleur de thym",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Piment d'Espelette & Zestes d'agrumes",
        "descriptionEpices": "Piment d'Espelette et zestes de citron",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Maquereaux vidés ou filets épais (truite, cabillaud)",
        "nom": "Maquereaux vidés ou filets épais (truite, cabillaud)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 10,
        "prix": 10
      },
      {
        "nomIngredient": "Eau pour saumure (80 g sel / L)",
        "nom": "Eau pour saumure (80 g sel / L)",
        "modeCalcul": "AU_GOUT",
        "quantite": 1,
        "qte": 1,
        "unite": "L",
        "prixKgOuUniteEstime": 0.5,
        "prix": 0.5
      },
      {
        "nomIngredient": "Sel fin de mer",
        "nom": "Sel fin de mer",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 80,
        "qte": 80,
        "unite": "g",
        "prixKgOuUniteEstime": 1.5,
        "prix": 1.5
      },
      {
        "nomIngredient": "Sucre de canne",
        "nom": "Sucre de canne",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 20,
        "qte": 20,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Saumurage liquide (1 h 30)",
        "instructions": "Dissoudre 80 g de sel et 20 g de sucre par litre d'eau froide. Immerger les poissons pendant 1h30 au frais.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 90,
        "dureeH": 1.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Égouttage & Séchage",
        "instructions": "Rincer brièvement, essuyer et laisser sécher 2 h sur grille à l'air libre pour que la peau sèche bien.",
        "astuce": "",
        "offsetDebutMinutes": 90,
        "dureeMinutes": 120,
        "dureeH": 2,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Fumage à chaud (1 h 30 à 75-80 °C)",
        "instructions": "Monter le fumoir entre 75 °C et 85 °C avec fumée dense. Cuire jusqu'à ce que la chair soit opaque et floconneuse (65 °C à cœur).",
        "astuce": "",
        "offsetDebutMinutes": 210,
        "dureeMinutes": 90,
        "dureeH": 1.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "GIBIER_CHEVREUIL_SECHE",
    "code": "GIBIER_CHEVREUIL_SECHE",
    "nom": "Filet de chevreuil ou cerf séché",
    "famille": "Gibier & Foie",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1,
    "perteCiblePct": 35,
    "perteCible": 35,
    "tempCoeurCible": null,
    "conditionsConservation": "Bas du réfrigérateur en torchon : 3 à 5 semaines (perte 35%).",
    "pointsVigilance": "Viande très maigre : le séchage est rapide, surveiller le poids régulièrement pour éviter un dessèchement excessif.",
    "description": "Morceau noble de gibier rouge (filet ou rôti de cuisse de chevreuil/cerf) salé au poivre sauvage, baies de genièvre et vin rouge.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Poivre sauvage & Genièvre",
        "descriptionEpices": "Poivre sauvage de Madagascar concassé et baies de genièvre",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Fumé à froid au bois de chêne",
        "descriptionEpices": "Fumage délicat 10 h au bois de chêne",
        "epicesGrammesParUnite": 12,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Filet ou noix de cuissot de chevreuil",
        "nom": "Filet ou noix de cuissot de chevreuil",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 0,
        "prix": 0
      },
      {
        "nomIngredient": "Sel fin / gros sel (3%)",
        "nom": "Sel fin / gros sel (3%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 30,
        "qte": 30,
        "unite": "g",
        "prixKgOuUniteEstime": 1.5,
        "prix": 1.5
      },
      {
        "nomIngredient": "Sucre roux (0,8%)",
        "nom": "Sucre roux (0,8%)",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 8,
        "qte": 8,
        "unite": "g",
        "prixKgOuUniteEstime": 2,
        "prix": 2
      },
      {
        "nomIngredient": "Genièvre, poivre concassé, laurier",
        "nom": "Genièvre, poivre concassé, laurier",
        "modeCalcul": "POURCENT_POIDS",
        "quantite": 12,
        "qte": 12,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Salage à l'équilibre sous vide (8 à 10 jours)",
        "instructions": "Masser le filet avec sel, sucre et aromates. Sceller sous vide au réfrigérateur (3 °C) pendant 8 à 10 jours.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 12960,
        "dureeH": 216,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Rinçage rapide & Essuyage",
        "instructions": "Rincer brièvement à l'eau froide, sécher très soigneusement et poivrer à nouveau si souhaité.",
        "astuce": "",
        "offsetDebutMinutes": 12960,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Séchage 3 à 4 semaines en torchon",
        "instructions": "Rouler dans un torchon sec et laisser affiner au bas du réfrigérateur jusqu'à 35% de perte de poids.",
        "astuce": "",
        "offsetDebutMinutes": 30240,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "VIANDE_FUMEE_TRADI",
    "code": "VIANDE_FUMEE_TRADI",
    "nom": "Salaison fumée traditionnelle (Bœuf ou Porc)",
    "famille": "Bœuf",
    "typeRecette": "FUME",
    "type": "FUME",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 1.5,
    "perteCiblePct": 30,
    "perteCible": 30,
    "tempCoeurCible": null,
    "conditionsConservation": "Cave d'affinage (12-14 °C) ou bac du réfrigérateur.",
    "pointsVigilance": "Fumer par passes de 6 à 8 h espacées de 12 h de repos à l'air frais pour une saveur boisée subtile sans amertume.",
    "description": "Pièce de viande rouge ou échine salée au sel sec aromatique puis fumée à froid en passes successives au bois de hêtre et romarin.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Double passe de fumage (Corsé)",
        "descriptionEpices": "Deux fumages de 8 h espacés de 24 h",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      },
      {
        "nom": "Fumé doux au hêtre & romarin",
        "descriptionEpices": "Un seul fumage de 8 h avec brins de romarin séché",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 0,
        "ajouteEtapeFumage": true
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Noix de bœuf ou filet de porc",
        "nom": "Noix de bœuf ou filet de porc",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "qte": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 18,
        "prix": 18
      },
      {
        "nomIngredient": "Gros sel de salaison",
        "nom": "Gros sel de salaison",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 500,
        "qte": 500,
        "unite": "g",
        "prixKgOuUniteEstime": 1,
        "prix": 1
      },
      {
        "nomIngredient": "Poivre concassé & aromates",
        "nom": "Poivre concassé & aromates",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 15,
        "qte": 15,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      },
      {
        "nomIngredient": "Sciure de hêtre",
        "nom": "Sciure de hêtre",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 350,
        "qte": 350,
        "unite": "g",
        "prixKgOuUniteEstime": 4,
        "prix": 4
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Salage au gros sel (24 h à 36 h)",
        "instructions": "Enfouir la pièce dans le gros sel aromatisé au réfrigérateur (24 h par kg).",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 1440,
        "dureeH": 24,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Dessalage (1 h en eau froide) & Séchage (24 h)",
        "instructions": "Dessaler 1 heure dans un grand volume d'eau froide. Laisser sécher 24 h au frais sur grille suspendue.",
        "astuce": "",
        "offsetDebutMinutes": 1440,
        "dureeMinutes": 1500,
        "dureeH": 25,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Fumage à froid (8 h)",
        "instructions": "Allumer le générateur de fumée froide au hêtre (< 22 °C). Fumer 8 heures.",
        "astuce": "",
        "offsetDebutMinutes": 2940,
        "dureeMinutes": 480,
        "dureeH": 8,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Séchage & Affinage final (3 à 5 semaines)",
        "instructions": "Suspendre en séchoir ou envelopper en torchon jusqu'à obtenir une belle texture ferme et souple.",
        "astuce": "",
        "offsetDebutMinutes": 25920,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  },
  {
    "id": "GIGOT_SANGLIER_SECHE",
    "code": "GIGOT_SANGLIER_SECHE",
    "nom": "Gigot de sanglier salé et séché",
    "famille": "Gibier & Foie",
    "typeRecette": "SALAISON_SECHE",
    "type": "SALAISON_SECHE",
    "uniteBase": "kg",
    "unite": "kg",
    "quantiteDefaut": 3.5,
    "perteCiblePct": 35,
    "perteCible": 35,
    "tempCoeurCible": null,
    "conditionsConservation": "Salage au frais (2-4 °C), puis séchage / affinage à 12-15 °C (70-80 % HR) ou bas du réfrigérateur pendant 6 à 12 semaines (perte cible 35 %).",
    "pointsVigilance": "• Contrôle sanitaire du sanglier obligatoire (trichine).\n• Bien parer le gigot (retirer caillots, membranes et excès de gras).\n• Avec os : bien masser le sel le long de l'os et de l'articulation.",
    "description": "Gigot (cuissot) de sanglier salé au gros sel ou sous vide à l'équilibre, décliné en deux lots simples : Poivre ou Original, puis séché lentement.",
    "masquee": false,
    "sortiesDecoupe": [],
    "variantes": [
      {
        "nom": "Poivre",
        "descriptionEpices": "Poivre noir concassé généreux sur toute la surface",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 144,
        "ajouteEtapeFumage": false
      },
      {
        "nom": "Original",
        "descriptionEpices": "Recette originale : baies de genièvre concassées, thym, laurier, ail et poivre noir",
        "epicesGrammesParUnite": 15,
        "dureeSalageHeuresSpecifique": 144,
        "ajouteEtapeFumage": false
      }
    ],
    "ingredients": [
      {
        "nomIngredient": "Gigot de sanglier paré",
        "nom": "Gigot de sanglier paré",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 0,
        "prix": 0
      },
      {
        "nomIngredient": "Gros sel non iodé (recouvrement)",
        "nom": "Gros sel non iodé (recouvrement)",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 1000,
        "unite": "g",
        "prixKgOuUniteEstime": 1,
        "prix": 1
      },
      {
        "nomIngredient": "Poivre / Épices",
        "nom": "Poivre / Épices",
        "modeCalcul": "PAR_KG_MATIERE",
        "quantite": 15,
        "unite": "g",
        "prixKgOuUniteEstime": 25,
        "prix": 25
      }
    ],
    "etapes": [
      {
        "ordre": 1,
        "titre": "Parage & Préparation du gigot",
        "instructions": "• Parer soigneusement le gigot (retirer membranes, caillots et gras irrégulier).\n• Masser le long de l'os pour chasser le sang résiduel.",
        "astuce": "",
        "offsetDebutMinutes": 0,
        "dureeMinutes": 45,
        "dureeH": 0.75,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 2,
        "titre": "Salage au gros sel par recouvrement (1,5 à 2 j/kg)",
        "instructions": "• Frotter vigoureusement le gigot avec le gros sel non iodé (insister près de l'os).\n• Enfouir complètement dans un bac de gros sel au réfrigérateur (2-4 °C).\n• Retourner tous les 2 jours et compléter le sel si nécessaire.",
        "astuce": "",
        "offsetDebutMinutes": 45,
        "dureeMinutes": 8640,
        "dureeH": 144,
        "varianteCible": null,
        "modeDuree": "PAR_KG",
        "facultative": false
      },
      {
        "ordre": 3,
        "titre": "Rinçage & Dessalage (2 h en eau froide)",
        "instructions": "• Sortir le gigot du sel et rincer à l'eau froide.\n• Dessaler 2 heures dans un grand volume d'eau froide en changeant l'eau à mi-parcours.\n• Essuyer et sécher parfaitement au torchon propre.",
        "astuce": "",
        "offsetDebutMinutes": 8685,
        "dureeMinutes": 120,
        "dureeH": 2,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 4,
        "titre": "Épiçage par lot (Poivre / Original) & Ficelage",
        "instructions": "• Appliquer les épices selon chaque lot (Poivre noir concassé ou mélange Original genièvre/thym/laurier/poivre).\n• Ficeler serré ou mettre en filet/torchon et noter le poids initial !",
        "astuce": "",
        "offsetDebutMinutes": 8805,
        "dureeMinutes": 30,
        "dureeH": 0.5,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      },
      {
        "ordre": 5,
        "titre": "Séchage & Affinage (6 à 12 semaines, perte cible 35 %)",
        "instructions": "• Suspendre en cave d'affinage (12-15 °C, 75 % HR) ou bas du réfrigérateur.\n• Peser régulièrement jusqu'à atteindre 35 % de perte de poids.",
        "astuce": "",
        "offsetDebutMinutes": 60480,
        "dureeMinutes": 60,
        "dureeH": 1,
        "varianteCible": null,
        "modeDuree": "FIXE",
        "facultative": false
      }
    ]
  }
];

// 2. Paramètres & Tarifs par défaut (issus de l'APK)
export const PARAMETRES_DEFAUT = [
  {
    "cle": "ACTIVER_PRIX",
    "libelle": "Gestion des prix & coûts",
    "categorie": "GENERAL",
    "valeur": 1,
    "unite": "option",
    "description": "Afficher ou masquer tout ce qui concerne les prix, coûts et budgets"
  },
  {
    "cle": "ACTIVER_REVENTE",
    "libelle": "Activer l'option Revente",
    "categorie": "GENERAL",
    "valeur": 1,
    "unite": "option",
    "description": "Afficher ou masquer les éléments liés à la revente"
  },
  {
    "cle": "PRIX_CANARD",
    "libelle": "Prix d'achat d'un canard",
    "categorie": "CANARD",
    "valeur": 18,
    "unite": "€/canard",
    "description": "Prix d'achat d'un canard gras entier sans foie"
  },
  {
    "cle": "PRIX_SEL_KG",
    "libelle": "Prix du gros sel",
    "categorie": "GENERAL",
    "valeur": 1,
    "unite": "€/kg",
    "description": "Gros sel de salaison non iodé"
  },
  {
    "cle": "PRIX_SEL_NITRITE_KG",
    "libelle": "Prix du sel nitrité (0,6%)",
    "categorie": "GENERAL",
    "valeur": 4.5,
    "unite": "€/kg",
    "description": "Sel nitrité pour charcuterie"
  },
  {
    "cle": "PRIX_EPICES_KG",
    "libelle": "Prix moyen des épices",
    "categorie": "GENERAL",
    "valeur": 25,
    "unite": "€/kg",
    "description": "Poivre, paprika, café, herbes"
  },
  {
    "cle": "MARGE_AMIS_PCT",
    "libelle": "Majoration par défaut (prix de revente conseillé)",
    "categorie": "GENERAL",
    "valeur": 10,
    "unite": "%",
    "description": "Appliquée au coût de revient pour suggérer un prix de revente conseillé"
  },
  {
    "cle": "REND_MAGRET",
    "libelle": "Magrets par canard",
    "categorie": "CANARD",
    "valeur": 2,
    "unite": "pièces",
    "description": "2 magrets par canard"
  },
  {
    "cle": "REND_CUISSE",
    "libelle": "Cuisses par canard",
    "categorie": "CANARD",
    "valeur": 2,
    "unite": "pièces",
    "description": "2 cuisses par canard"
  },
  {
    "cle": "REND_GRAISSE_FONDUE",
    "libelle": "Graisse fondue totale par canard",
    "categorie": "CANARD",
    "valeur": 0.5,
    "unite": "kg",
    "description": "Issue de la peau et du gras"
  },
  {
    "cle": "GRAISSE_CONFIT_CUISSE",
    "libelle": "Graisse utilisée par cuisse confite",
    "categorie": "CANARD",
    "valeur": 0.15,
    "unite": "kg",
    "description": "Graisse nécessaire au confisage"
  },
  {
    "cle": "REND_RILLETTES",
    "libelle": "Rillettes par canard",
    "categorie": "CANARD",
    "valeur": 0.25,
    "unite": "kg",
    "description": "Cou + chair de carcasse + manchons"
  },
  {
    "cle": "GRAISSE_RILLETTES_KG",
    "libelle": "Graisse par kg de rillettes",
    "categorie": "CANARD",
    "valeur": 0.4,
    "unite": "kg",
    "description": "Incorporée aux rillettes"
  },
  {
    "cle": "REND_BOUILLON",
    "libelle": "Bouillons (50 cl) par canard",
    "categorie": "CANARD",
    "valeur": 2,
    "unite": "bocaux",
    "description": "À partir de la carcasse rôtie"
  },
  {
    "cle": "REND_GRATTON",
    "libelle": "Grattons par canard",
    "categorie": "CANARD",
    "valeur": 0.2,
    "unite": "kg",
    "description": "Sous-produit de la fonte des peaux"
  },
  {
    "cle": "SEL_PAR_MAGRET",
    "libelle": "Gros sel par magret",
    "categorie": "CANARD",
    "valeur": 0.5,
    "unite": "kg",
    "description": "500 g par magret pour le salage"
  },
  {
    "cle": "EPICES_PAR_MAGRET",
    "libelle": "Épices par magret",
    "categorie": "CANARD",
    "valeur": 0.015,
    "unite": "kg",
    "description": "15 g par magret"
  },
  {
    "cle": "REF_MAGRET",
    "libelle": "Valeur boutique Magret séché",
    "categorie": "PRIX_REF",
    "valeur": 14,
    "unite": "€/pièce",
    "description": "Valeur en boutique d'un magret séché"
  },
  {
    "cle": "REF_CUISSE",
    "libelle": "Valeur boutique Cuisse confite",
    "categorie": "PRIX_REF",
    "valeur": 7,
    "unite": "€/pièce",
    "description": "Valeur en boutique d'une cuisse confite"
  },
  {
    "cle": "REF_RILLETTES",
    "libelle": "Valeur boutique Rillettes",
    "categorie": "PRIX_REF",
    "valeur": 28,
    "unite": "€/kg",
    "description": "Valeur en boutique au kg"
  },
  {
    "cle": "REF_BOUILLON",
    "libelle": "Valeur boutique Bouillon 50 cl",
    "categorie": "PRIX_REF",
    "valeur": 3,
    "unite": "€/bocal",
    "description": "Valeur en boutique d'un bocal de 50 cl"
  },
  {
    "cle": "REF_GRATTON",
    "libelle": "Valeur boutique Grattons",
    "categorie": "PRIX_REF",
    "valeur": 22,
    "unite": "€/kg",
    "description": "Valeur en boutique au kg"
  },
  {
    "cle": "REF_GRAISSE",
    "libelle": "Valeur boutique Graisse en pot",
    "categorie": "PRIX_REF",
    "valeur": 12,
    "unite": "€/kg",
    "description": "Valeur en boutique au kg"
  },
  {
    "cle": "FR_CUISSE",
    "libelle": "Frais transfo Cuisse confite",
    "categorie": "FRAIS_TRANSFO",
    "valeur": 0.6,
    "unite": "€/pièce",
    "description": "Sachet sous vide + aromates"
  },
  {
    "cle": "FR_RILLETTES",
    "libelle": "Frais transfo Rillettes",
    "categorie": "FRAIS_TRANSFO",
    "valeur": 2,
    "unite": "€/kg",
    "description": "Bocaux, joints, aromates"
  },
  {
    "cle": "FR_BOUILLON",
    "libelle": "Frais transfo Bouillon (50 cl)",
    "categorie": "FRAIS_TRANSFO",
    "valeur": 0.6,
    "unite": "€/bocal",
    "description": "Bocal, légumes garniture"
  },
  {
    "cle": "FR_GRATTON",
    "libelle": "Frais transfo Grattons",
    "categorie": "FRAIS_TRANSFO",
    "valeur": 1,
    "unite": "€/kg",
    "description": "Conditionnement, sel/poivre"
  },
  {
    "cle": "FR_GRAISSE",
    "libelle": "Frais transfo Graisse en pot",
    "categorie": "FRAIS_TRANSFO",
    "valeur": 2,
    "unite": "€/kg",
    "description": "Pot en verre"
  }
];

// 3. Ingrédients du catalogue (issus de l'APK)
export const INGREDIENTS_CATALOGUE_DEFAUT = [
  {
    "nom": "Canard gras entier (sans foie)",
    "categorie": "VIANDE",
    "unite": "pièce",
    "prixUnitaire": 18
  },
  {
    "nom": "Jambon frais entier avec os",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 9.5
  },
  {
    "nom": "Noix de jambon / Épaule désossée",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 11
  },
  {
    "nom": "Échine de porc désossée",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 10.5
  },
  {
    "nom": "Filet mignon de porc",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 13.5
  },
  {
    "nom": "Joue / Gorge de porc",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 8.5
  },
  {
    "nom": "Poitrine de porc fraîche",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 9
  },
  {
    "nom": "Rond de gîte / Noix de bœuf",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 22
  },
  {
    "nom": "Filet de bœuf",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 38
  },
  {
    "nom": "Poitrine de bœuf (Brisket)",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 16
  },
  {
    "nom": "Filet de saumon frais avec peau",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 24
  },
  {
    "nom": "Foie gras cru",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 48
  },
  {
    "nom": "Viande de sanglier dénervée",
    "categorie": "VIANDE",
    "unite": "kg",
    "prixUnitaire": 0
  },
  {
    "nom": "Gros sel non iodé",
    "categorie": "SEL_SUCRE",
    "unite": "kg",
    "prixUnitaire": 1
  },
  {
    "nom": "Sel fin de mer",
    "categorie": "SEL_SUCRE",
    "unite": "kg",
    "prixUnitaire": 1.5
  },
  {
    "nom": "Sel nitrité (0,6%)",
    "categorie": "SEL_SUCRE",
    "unite": "kg",
    "prixUnitaire": 4.5
  },
  {
    "nom": "Sucre / Cassonade",
    "categorie": "SEL_SUCRE",
    "unite": "kg",
    "prixUnitaire": 2
  },
  {
    "nom": "Dextrose",
    "categorie": "SEL_SUCRE",
    "unite": "kg",
    "prixUnitaire": 6
  },
  {
    "nom": "Poivre noir en grains / moulu",
    "categorie": "EPICES",
    "unite": "kg",
    "prixUnitaire": 25
  },
  {
    "nom": "Paprika / Pimentón",
    "categorie": "EPICES",
    "unite": "kg",
    "prixUnitaire": 25
  },
  {
    "nom": "Café moulu (pour magret)",
    "categorie": "EPICES",
    "unite": "kg",
    "prixUnitaire": 20
  },
  {
    "nom": "Piment d'Espelette AOP",
    "categorie": "EPICES",
    "unite": "kg",
    "prixUnitaire": 65
  },
  {
    "nom": "Sciure de hêtre (fumage à froid)",
    "categorie": "CONSOMMABLES",
    "unite": "kg",
    "prixUnitaire": 4
  },
  {
    "nom": "Boyaux naturels de porc",
    "categorie": "CONSOMMABLES",
    "unite": "m",
    "prixUnitaire": 0.8
  }
];
