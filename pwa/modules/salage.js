// Adaptation des étapes, durées et courses selon le mode de salage :
// "RECOUVREMENT_SEL" (gros sel) vs "SOUS_VIDE" (salage à l'équilibre 3 %)

export const MODE_SALAGE = {
  RECOUVREMENT_SEL: 'RECOUVREMENT_SEL',
  SOUS_VIDE: 'SOUS_VIDE'
};

export function modeSalageParDefaut(recette) {
  const etapes = recette?.etapes || [];
  const aSalageSousVide = etapes.some(e => {
    const t = (e.titre || '').toLowerCase();
    return t.includes('sous vide') && (t.includes('sal') || t.includes('marin'));
  });
  return aSalageSousVide ? MODE_SALAGE.SOUS_VIDE : MODE_SALAGE.RECOUVREMENT_SEL;
}

export function formaterDureeSalage(heures) {
  const h = Math.max(1, Math.round(heures));
  if (heures < 2.0) {
    const mins = Math.round(heures * 60);
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    if (hh > 0 && mm > 0) return `${hh}h${String(mm).padStart(2, '0')}`;
    if (hh > 0) return `${hh} h`;
    return `${mm} min`;
  }
  if (h < 48) return `${h} h`;
  if (h % 24 === 0) return `${h / 24} jours`;
  const jours = Math.round((heures / 24) * 10) / 10;
  return `${jours} jours (${h} h)`;
}

export function dureeSalageHeuresAdaptee(recette, modeSalage, quantiteBase, dureeVarianteHeures = null) {
  const code = recette?.code || recette?.id || '';
  const q = Math.max(0.5, Number(quantiteBase) || 1);

  if (modeSalage === MODE_SALAGE.RECOUVREMENT_SEL) {
    switch (code) {
      case 'VALORISATION_CANARD':
      case 'MAGRET_SECHE_SEUL':
        return dureeVarianteHeures ?? 24;
      case 'LONZO':
        return 12;
      case 'TRUITE_SAUMON_FUME':
        return 7;
      case 'GRAVLAX_SAUMON':
        return dureeVarianteHeures ?? 48;
      case 'GRAVLAX_BOEUF':
        return 30;
      case 'POISSON_FUME_CHAUD':
        return 2;
      case 'JAMBON_CRU':
        return Math.min(504, Math.max(168, q * 42));
      case 'GIGOT_SANGLIER_SECHE':
        return Math.min(240, Math.max(96, q * 42));
      case 'VIANDE_FUMEE_TRADI':
      case 'POITRINE_FUMEE':
        return Math.min(48, Math.max(24, q * 24));
      case 'COPPA':
      case 'GUANCIALE':
      case 'BOEUF_SECHE':
      case 'SANGLIER_SECHE':
      case 'GIBIER_CHEVREUIL_SECHE':
        return Math.min(72, Math.max(24, q * 24));
      case 'JAMBON_BLANC':
        return 48;
      case 'FOIE_GRAS':
        return 12;
      default:
        return dureeVarianteHeures ?? 24;
    }
  }

  // MODE_SALAGE.SOUS_VIDE
  switch (code) {
    case 'VALORISATION_CANARD':
    case 'MAGRET_SECHE_SEUL':
      return (dureeVarianteHeures !== null && dureeVarianteHeures < 24) ? 120 : 144;
    case 'LONZO':
      return 144;
    case 'TRUITE_SAUMON_FUME':
      return 48;
    case 'GRAVLAX_SAUMON':
      return (dureeVarianteHeures !== null && dureeVarianteHeures <= 10) ? 48 : 72;
    case 'GRAVLAX_BOEUF':
      return 72;
    case 'POISSON_FUME_CHAUD':
      return 12;
    case 'JAMBON_CRU':
      return Math.min(720, Math.max(336, q * 60));
    case 'GIGOT_SANGLIER_SECHE':
      return Math.min(432, Math.max(288, q * 72));
    case 'POITRINE_FUMEE':
    case 'VIANDE_FUMEE_TRADI':
      return 168;
    case 'GIBIER_CHEVREUIL_SECHE':
      return 216;
    case 'BOEUF_SECHE':
      return 240;
    case 'COPPA':
    case 'GUANCIALE':
    case 'SANGLIER_SECHE':
      return 288;
    case 'JAMBON_BLANC':
      return 120;
    default:
      return 24;
  }
}

export function adapterEtapesPourModeSalage(recette, etapesFiltrees, modeSalage, quantiteBase) {
  const nativeMode = modeSalageParDefaut(recette);
  const qDefaut = Math.max(1, Number(recette?.quantiteDefaut) || 1);

  const dureeEffective = (e) => {
    const base = Number(e.dureeMinutes) || 60;
    if (e.modeDuree === 'PAR_KG') {
      return Math.max(1, Math.round(base * (quantiteBase / qDefaut)));
    }
    return base;
  };

  if (modeSalage === nativeMode) {
    return etapesFiltrees.map(e => ({
      titre: e.titre,
      instructions: e.instructions,
      astuce: e.astuce || '',
      offsetDebutMinutes: e.offsetDebutMinutes || 0,
      dureeMinutes: dureeEffective(e),
      varianteCible: e.varianteCible || ''
    }));
  }

  if ((recette?.code || recette?.id) === 'VALORISATION_CANARD' && modeSalage === MODE_SALAGE.SOUS_VIDE) {
    return adapterCanardEnSousVide(etapesFiltrees, dureeEffective);
  }

  const salageIdx = etapesFiltrees.findIndex(e => {
    const t = (e.titre || '').toLowerCase();
    return t.includes('salage') ||
      t.includes('salaison') ||
      t.includes('mise au sel') ||
      t.includes('marinade') ||
      t.includes('saumurage') ||
      (t.includes('enrobage') && t.includes('sel'));
  });

  if (salageIdx === -1) {
    return etapesFiltrees.map((e, idx) => ({
      titre: e.titre,
      instructions: (idx === 0 && modeSalage === MODE_SALAGE.SOUS_VIDE)
        ? `${e.instructions}\n• Option sous-vide activée : mettre la préparation sous vide au réfrigérateur (2-4 °C, 24 h) pour une maturation homogène.`
        : e.instructions,
      astuce: e.astuce || '',
      offsetDebutMinutes: e.offsetDebutMinutes || 0,
      dureeMinutes: dureeEffective(e),
      varianteCible: e.varianteCible || ''
    }));
  }

  const salageEtape = etapesFiltrees[salageIdx];
  const oldSalageDur = dureeEffective(salageEtape);
  const newSalageHours = dureeSalageHeuresAdaptee(recette, modeSalage, quantiteBase);
  const newSalageDur = Math.round(newSalageHours * 60);
  const dureeLibelle = formaterDureeSalage(newSalageHours);

  const nextIdx = salageIdx + 1;
  const hasRinseStep = nextIdx < etapesFiltrees.length && (() => {
    const t = (etapesFiltrees[nextIdx].titre || '').toLowerCase();
    return t.includes('dessal') || t.includes('rinç') || t.includes('rinc') || t.includes('sortie');
  })();

  const oldRinseDur = hasRinseStep ? dureeEffective(etapesFiltrees[nextIdx]) : 0;
  const newRinseDur = !hasRinseStep ? 0 : (modeSalage === MODE_SALAGE.SOUS_VIDE ? 20 : (newSalageHours >= 72 ? 120 : 60));

  const salageOffset = salageEtape.offsetDebutMinutes || 0;
  const deltaSalage = newSalageDur - oldSalageDur;
  const deltaTotal = hasRinseStep
    ? (salageOffset + newSalageDur + newRinseDur) - ((etapesFiltrees[nextIdx].offsetDebutMinutes || 0) + oldRinseDur)
    : deltaSalage;

  return etapesFiltrees.map((e, idx) => {
    if (idx === salageIdx) {
      return {
        titre: modeSalage === MODE_SALAGE.SOUS_VIDE
          ? `Salage à l'équilibre sous vide (${dureeLibelle})`
          : `Salage par recouvrement au gros sel (${dureeLibelle})`,
        instructions: modeSalage === MODE_SALAGE.SOUS_VIDE
          ? `• Peser la pièce au gramme près.\n• Frotter avec 30 g/kg de sel fin non iodé (ou sel nitrité 3 %), 10 g/kg de sucre (1 %) et les aromates.\n• Mettre sous vide et placer au réfrigérateur (2-4 °C) pendant ${dureeLibelle} en retournant tous les 2 jours.`
          : `• Frotter la pièce avec du gros sel non iodé.\n• Enfouir complètement dans un bac de gros sel au réfrigérateur (2-4 °C) pendant ${dureeLibelle}.\n• Retourner régulièrement et compléter le sel si nécessaire.`,
        astuce: e.astuce || '',
        offsetDebutMinutes: e.offsetDebutMinutes || 0,
        dureeMinutes: newSalageDur,
        varianteCible: e.varianteCible || ''
      };
    }
    if (hasRinseStep && idx === nextIdx) {
      return {
        titre: modeSalage === MODE_SALAGE.SOUS_VIDE
          ? 'Sortie du sac sous vide & Rinçage rapide (sans dessalage)'
          : `Sortie du sel, Rinçage & Dessalage (${newRinseDur / 60} h)`,
        instructions: modeSalage === MODE_SALAGE.SOUS_VIDE
          ? '• Sortir la viande du sac sous vide.\n• Rincer brièvement à l\'eau froide (ne pas faire tremper : le sel est déjà à l\'équilibre).\n• Sécher méticuleusement au torchon propre.'
          : `• Sortir la viande du gros sel et rincer abondamment à l'eau froide.\n• Dessaler ${newRinseDur / 60} h dans un grand volume d'eau froide en changeant l'eau à mi-parcours.\n• Essuyer et sécher parfaitement au torchon propre.`,
        astuce: e.astuce || '',
        offsetDebutMinutes: salageOffset + newSalageDur,
        dureeMinutes: newRinseDur,
        varianteCible: e.varianteCible || ''
      };
    }
    if (idx > salageIdx) {
      return {
        titre: e.titre,
        instructions: e.instructions,
        astuce: e.astuce || '',
        offsetDebutMinutes: Math.max(0, (e.offsetDebutMinutes || 0) + deltaTotal),
        dureeMinutes: dureeEffective(e),
        varianteCible: e.varianteCible || ''
      };
    }
    return {
      titre: e.titre,
      instructions: e.instructions,
      astuce: e.astuce || '',
      offsetDebutMinutes: e.offsetDebutMinutes || 0,
      dureeMinutes: dureeEffective(e),
      varianteCible: e.varianteCible || ''
    };
  });
}

function adapterCanardEnSousVide(etapesFiltrees, dureeEffective) {
  const offsetSousVideFume = 5 * 1440;
  const offsetSousVideStandard = 6 * 1440;

  const mapped = etapesFiltrees.map(e => {
    switch (e.ordre) {
      case 2:
        return {
          titre: 'Samedi · Tri des Gras & Salage sous vide (Magrets à fumer - 5 j)',
          instructions: '• Séparez le gras pur (cubes) du gras avec peau/viande (pour les grattons).\n• Salage sous vide à l\'équilibre des magrets à fumer : frottez avec 30 g/kg de sel et 10 g/kg de sucre, puis scellez sous vide au réfrigérateur (5 jours).',
          astuce: e.astuce || '',
          offsetDebutMinutes: e.offsetDebutMinutes || 0,
          dureeMinutes: 45,
          varianteCible: e.varianteCible || ''
        };
      case 3:
        return {
          titre: 'Samedi · Salage sous vide des Magrets (6 j) & Sel Cuisses',
          instructions: '• Frottez les autres magrets avec 30 g/kg de sel et 10 g/kg de sucre, puis mettez-les sous vide au réfrigérateur pour 6 jours.\n• Mettez les cuisses et cous destinés au confit au gros sel (24 h) ou sous vide.\n• Mettez sous vide les aiguillettes (congélateur / rillettes).',
          astuce: e.astuce || '',
          offsetDebutMinutes: e.offsetDebutMinutes || 0,
          dureeMinutes: 45,
          varianteCible: e.varianteCible || ''
        };
      case 8:
        return {
          titre: 'J+5 · Sortie sous vide & Rinçage rapide (Magrets Fumés)',
          instructions: '• Sortez les magrets à fumer de leur sachet sous vide (après 5 jours).\n• Rincez brièvement à l\'eau froide (sans dessalage) et séchez parfaitement.',
          astuce: e.astuce || '',
          offsetDebutMinutes: offsetSousVideFume,
          dureeMinutes: 20,
          varianteCible: e.varianteCible || ''
        };
      case 9:
        return {
          titre: 'J+5 · Lancement du Fumage à froid (Magrets)',
          instructions: e.instructions,
          astuce: e.astuce || '',
          offsetDebutMinutes: offsetSousVideFume + 20,
          dureeMinutes: dureeEffective(e),
          varianteCible: e.varianteCible || ''
        };
      case 10:
        return {
          titre: 'Dimanche · Dessalage des Cuisses & Cous (24 h)',
          instructions: '• Sortez les cuisses et cous du gros sel (après 24 h) et dessalez 1 heure dans l\'eau froide.\n• (Les magrets restent sous vide jusqu\'à J+6).',
          astuce: e.astuce || '',
          offsetDebutMinutes: e.offsetDebutMinutes || 0,
          dureeMinutes: 60,
          varianteCible: e.varianteCible || ''
        };
      case 11:
        return {
          titre: 'Dimanche · Immersion des Cuisses au confit',
          instructions: '• Séchez les cuisses et plongez-les dans la graisse fondue chaude (complètement immergées).',
          astuce: e.astuce || '',
          offsetDebutMinutes: e.offsetDebutMinutes || 0,
          dureeMinutes: 30,
          varianteCible: e.varianteCible || ''
        };
      case 16:
        return {
          titre: 'Dimanche soir · Filtrage du bouillon',
          instructions: '• Filtrez le bouillon de carcasse (retirez le disque de graisse figée en surface).\n• (Les magrets sont en cours de salage sous vide jusqu\'à J+5 / J+6).',
          astuce: e.astuce || '',
          offsetDebutMinutes: e.offsetDebutMinutes || 0,
          dureeMinutes: dureeEffective(e),
          varianteCible: e.varianteCible || ''
        };
      case 17:
        return {
          titre: 'J+27 à J+48 · Contrôle séchage des Magrets (3 à 6 semaines)',
          instructions: e.instructions,
          astuce: e.astuce || '',
          offsetDebutMinutes: offsetSousVideStandard + 30240,
          dureeMinutes: dureeEffective(e),
          varianteCible: e.varianteCible || ''
        };
      default:
        return {
          titre: e.titre,
          instructions: e.instructions,
          astuce: e.astuce || '',
          offsetDebutMinutes: e.offsetDebutMinutes || 0,
          dureeMinutes: dureeEffective(e),
          varianteCible: e.varianteCible || ''
        };
    }
  });

  mapped.push({
    titre: 'J+6 · Sortie sous vide, Épiçage des Magrets & Mise en torchon',
    instructions: '• Sortez les magrets du sous vide (après 6 jours), rincez brièvement sans dessaler et séchez.\n• Appliquez les épices selon chaque lot (Paprika, Café, Poivre...), roulez dans des torchons propres et placez en bas du frigo (3 à 6 semaines).',
    astuce: 'Pesez chaque magret avant la mise en torchon pour suivre la perte de poids (~32%).',
    offsetDebutMinutes: offsetSousVideStandard,
    dureeMinutes: 45,
    varianteCible: ''
  });

  return mapped.sort((a, b) => a.offsetDebutMinutes - b.offsetDebutMinutes);
}
