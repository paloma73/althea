// ─────────────────────────────────────────────
// Templates cliniques par section
// ─────────────────────────────────────────────

export interface SectionTemplates {
  field: string
  label: string
  templates: string[]
}

export const TEMPLATES: Record<string, string[]> = {
  motif_consultation: [
    'Douleur plantaire bilatérale',
    'Rééducation post-opératoire',
    'Bilan postural de contrôle',
    'Algies cervico-dorsales',
    'Trouble de la marche',
    'Douleur talonière chronique',
    'Suivi orthopédique',
    'Bilan préventif',
  ],

  douleur_type: [
    'Mécanique',
    'Inflammatoire',
    'Neuropathique',
    'Mixte',
    'Fonctionnelle',
    'Postural',
  ],

  douleur_localisation: [
    'Plante du pied gauche',
    'Plante du pied droit',
    'Talon bilatéral',
    'Cheville droite',
    'Cheville gauche',
    'Genou gauche',
    'Genou droit',
    'Rachis lombaire',
    'Rachis cervical',
    'Hanche droite',
    'Épaule gauche',
  ],

  postural_vue_frontale: [
    'Bassin équilibré',
    'Bascule droite du bassin',
    'Bascule gauche du bassin',
    'Épaule gauche abaissée',
    'Épaule droite abaissée',
    'Appui préférentiel droit',
    'Appui préférentiel gauche',
    'Équilibre symétrique',
    'Valgus genou bilatéral',
    'Varus genou bilatéral',
  ],

  postural_vue_sagittale: [
    'Lordose lombaire marquée',
    'Cyphose thoracique accentuée',
    'Antépulsion cervicale',
    'Posture globalement équilibrée',
    'Récurvatum des genoux',
    'Flexum des hanches',
    'Hyperlordose cervicale',
  ],

  postural_vue_posterieure: [
    'Scoliose légère convexe droite',
    'Scoliose légère convexe gauche',
    'Alignement rachidien correct',
    'Triangle de la taille asymétrique',
    'Valgus talonnier bilatéral',
    'Valgus talonnier gauche',
  ],

  dynamique_marche: [
    'Marche symétrique',
    'Boiterie d\'esquive droite',
    'Boiterie d\'esquive gauche',
    'Attaque talon présente',
    'Déroulé plantaire incomplet',
    'Pas raccourci côté droit',
    'Pas raccourci côté gauche',
    'Bonne propulsion digitale',
    'Marche antalgique',
  ],

  podologie_morphologie: [
    'Pied creux bilatéral',
    'Pied plat valgus gauche',
    'Pied plat valgus droit',
    'Hallux valgus bilatéral',
    'Hallux valgus gauche',
    'Pied normal',
    'Pied égyptien',
    'Pied grec',
    'Orteil en marteau',
  ],

  podologie_appuis: [
    'Hyperpression métatarsienne',
    'Appuis équilibrés',
    'Surcharge talonière bilatérale',
    'Surcharge métatarsienne antérieure',
    'Déficit appui médial',
    'Déficit appui latéral',
  ],

  conclusion_clinique: [
    'Syndrome douloureux plantaire',
    'Déséquilibre postural global',
    'Dysfonction podo-posturale',
    'Syndrome fémoro-patellaire',
    'Fasciite plantaire bilatérale',
    'Syndrome crural droit',
    'Posture compensatrice antalgique',
  ],

  axes_therapeutiques: [
    'Semelles orthopédiques sur mesure',
    'Kinésithérapie proprioceptive',
    'Renforcement musculaire ciblé',
    'Rééducation posturale globale',
    'Étirements musculaires quotidiens',
    'Conseils chaussage adapté',
    'Bilan ostéopathique recommandé',
  ],

  exercices_conseils: [
    'Étirements gastrocnémiens x2/jour',
    'Renforcement intrinsèque du pied',
    'Marche pieds nus sur terrain souple',
    'Éviter la station debout prolongée',
    'Porter des chaussures à semelle épaisse',
    'Exercices d\'équilibre unipodal',
    'Application de glace 10min après effort',
  ],
}

// Templates spécifiques pour antécédents
export const ANTECEDENTS_TEMPLATES = {
  antecedents_medicaux: [
    'Diabète type 2',
    'Hypertension artérielle',
    'Arthrose',
    'Ostéoporose',
    'Polyarthrite rhumatoïde',
    'RAS',
  ],
  antecedents_chirurgicaux: [
    'Prothèse totale de hanche droite',
    'Prothèse totale de genou gauche',
    'Arthrodèse cheville droite',
    'Ostéosynthèse fémur gauche',
    'RAS',
  ],
  antecedents_traumatiques: [
    'Entorse cheville récurrente droite',
    'Fracture métatarse gauche',
    'Rupture ligament croisé antérieur',
    'Fracture calcanéum droit',
    'RAS',
  ],
}
