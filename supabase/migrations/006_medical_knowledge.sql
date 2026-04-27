-- ═══════════════════════════════════════════════════════════════
-- ALTHEA — Migration 006 : base de connaissances médicale commune
-- À exécuter dans Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS medical_knowledge (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty  TEXT        NOT NULL,
  category   TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  tags       TEXT[]      DEFAULT '{}',
  active     BOOLEAN     DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tous les utilisateurs connectés peuvent lire (pas d'écriture via API)
ALTER TABLE medical_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture base médicale" ON medical_knowledge
  FOR SELECT TO authenticated USING (active = true);

-- ───────────────────────────────────────────────────────────────
-- DONNÉES INITIALES
-- ───────────────────────────────────────────────────────────────

INSERT INTO medical_knowledge (specialty, category, title, content, tags) VALUES

-- ── BIOMÉCANIQUE ──────────────────────────────────────────────
(
  'biomécanique', 'physiopathologie',
  'Valgus de l''arrière-pied et chaîne cinématique ascendante',
  'Le valgus de l''arrière-pied (pronation sous-talienne excessive) s''accompagne d''un effondrement de l''arche longitudinale médiale, d''une abduction de l''avant-pied et d''une rotation interne du tibia. Cette chaîne cinématique ascendante peut induire une surcharge du compartiment médial du genou, une hyperpression fémoro-patellaire et une tension excessive du fascia plantaire et du tibial postérieur.',
  ARRAY['valgus', 'arrière-pied', 'pronation', 'sous-talienne', 'arche médiale', 'genou', 'tibia', 'rotation interne', 'chaîne cinématique']
),
(
  'biomécanique', 'physiopathologie',
  'Rotation interne du membre inférieur et valgus dynamique de genou',
  'Une rotation interne excessive du membre inférieur en charge provoque un valgus dynamique de genou (genou en dedans lors de la mise en appui). Ce mécanisme est associé à la surcharge du compartiment médial, au syndrome fémoro-patellaire et au syndrome de la bandelette ilio-tibiale. Principales causes : hyperpronation pédieuse, faiblesse des rotateurs externes de hanche (moyen fessier), rétraction des adducteurs.',
  ARRAY['rotation interne', 'valgus dynamique', 'genou', 'compartiment médial', 'fémoro-patellaire', 'bandelette ilio-tibiale', 'moyen fessier', 'pronation']
),
(
  'biomécanique', 'physiopathologie',
  'Analyse de la marche : paramètres clés à observer',
  'L''analyse clinique de la marche observe : le timing du déroulé du pied (talonnade, appui médio-pied, propulsion), l''axe du pas, la position des segments (tibias, genoux, bassin), le valgus dynamique de genou, l''effondrement médio-pied à l''atterrissage, la symétrie du schéma. En course, noter l''attaque du sol (talon/médio-pied/avant-pied), l''affaissement pelvien, le degré de pronation dynamique et la cadence.',
  ARRAY['marche', 'analyse dynamique', 'déroulé', 'propulsion', 'valgus dynamique', 'médio-pied', 'course', 'attaque', 'pronation dynamique', 'bassin']
),

-- ── PODOLOGIE ─────────────────────────────────────────────────
(
  'podologie', 'physiopathologie',
  'Effondrement du médio-pied et pied plat acquis de l''adulte',
  'L''effondrement du médio-pied est souvent lié à une dysfonction du tendon tibial postérieur. On observe un aplatissement de l''arche interne, un arrière-pied valgus, un avant-pied en abduction. Cliniquement : signe du « trop d''orteils » visible depuis l''arrière. Rechercher un déficit du premier rayon (insuffisance du premier métatarse) qui favorise la pronation compensatrice.',
  ARRAY['médio-pied', 'effondrement', 'pied plat', 'tibial postérieur', 'premier rayon', 'abduction', 'trop d''orteils', 'insuffisance', 'valgus']
),
(
  'podologie', 'physiopathologie',
  'Déficit du premier rayon',
  'L''insuffisance du premier rayon (hypermobilité ou plantarflexion insuffisante) impose une compensation par pronation de l''arrière-pied lors de la propulsion. Cette instabilité médiale favorise le transfert de charge vers les métatarses centraux, le développement d''un hallux valgus et une surcharge du compartiment interne du genou via la chaîne ascendante.',
  ARRAY['premier rayon', 'insuffisance', 'hypermobilité', 'propulsion', 'pronation', 'hallux valgus', 'métatarse', 'compensatrice', 'compartiment interne']
),
(
  'podologie', 'diagnostic',
  'Fasciite plantaire (talalgie d''insertion)',
  'La fasciite plantaire est l''inflammation du fascia plantaire à son insertion calcanéenne. Douleur à la première mise en charge matinale (signe du réveil), à la palpation du tubercule médial du calcanéum, augmentant après station prolongée. Facteurs déclenchants : hyperpronation, rétraction du triceps sural, augmentation brutale de la charge. Traitement : étirements, orthèse avec soutien d''arche et creusement talonnier.',
  ARRAY['fasciite plantaire', 'talalgie', 'calcanéum', 'insertion', 'réveil', 'triceps sural', 'orthèse', 'arche', 'pronation']
),
(
  'podologie', 'diagnostic',
  'Hallux valgus et pathologie du 1er rayon',
  'L''hallux valgus est une déformation progressive du 1er métatarso-phalangien avec déviation latérale du gros orteil et saillie médiale de la tête du 1er métatarse. Favorisé par : insuffisance du 1er rayon, hyperpronation, chaussage inadapté, facteur génétique. Complications : métatarsalgies de transfert (2e rayon), griffe d''orteils. Traitement conservateur : orthèse d''écartement, soutien d''arche, chaussage large.',
  ARRAY['hallux valgus', 'premier rayon', 'métatarso-phalangien', 'métatarse', 'métatarsalgie', 'transfert', 'orthèse', 'chaussage', 'griffe']
),
(
  'podologie', 'diagnostic',
  'Névrome de Morton',
  'Le névrome de Morton est une fibrose périneurale du nerf plantaire commun, le plus souvent entre le 3e et 4e métatarse. Signes : douleur à la compression transverse de l''avant-pied (test de Mulder), paresthésies inter-orteils, soulagement au déchaussage. Facteurs favorisants : avant-pied étroit, hyperpronation. Traitement conservateur : barre métatarsienne, chaussage adapté.',
  ARRAY['Morton', 'névrome', 'métatarsalgie', 'nerf plantaire', 'Mulder', 'paresthésies', 'avant-pied', 'orthèse', 'interdigital']
),
(
  'podologie', 'diagnostic',
  'Tendinopathie du tendon d''Achille',
  'La tendinopathie achilléenne se manifeste par une douleur progressive du tendon d''Achille, 2-6 cm au-dessus de son insertion calcanéenne (forme corporale) ou à l''insertion même (enthèse). Facteurs : hyperpronation, rétraction du triceps, sur-sollicitation sportive. Traitement : exercices excentriques (protocole Alfredson), orthèse avec talonnette, chaussage adapté.',
  ARRAY['Achille', 'tendinopathie', 'tendon', 'insertion', 'calcanéum', 'excentrique', 'Alfredson', 'pronation', 'talonnette']
),

-- ── ORTHOPÉDIE ────────────────────────────────────────────────
(
  'orthopédie', 'diagnostic',
  'Surcharge du compartiment interne du genou',
  'La surcharge du compartiment interne du genou (gonarthrose médiale ou fémoro-tibiale interne) est fréquemment associée à un valgus de l''arrière-pied, un effondrement médio-pied et une rotation interne de la hanche. L''axe mécanique est dévié en valgus dynamique lors de la marche. On observe une douleur à la palpation de l''interligne médial, une possible tuméfaction et une douleur à la mise en charge.',
  ARRAY['genou', 'compartiment interne', 'gonarthrose', 'médial', 'douleur genou', 'valgus dynamique', 'interligne', 'genou interne', 'médiale']
),
(
  'orthopédie', 'diagnostic',
  'Syndrome fémoro-patellaire',
  'Le syndrome fémoro-patellaire se manifeste par une douleur antérieure du genou à l''effort (montée/descente des escaliers, course, position assise prolongée). Associé à un valgus de genou dynamique, une rotation interne tibiale excessive, une hyperpronation podiale. Le test de Clarke et la mobilisation passive de la rotule permettent d''évaluer la souffrance. Traitement : orthèse podologique, renforcement VMO, correction du valgus.',
  ARRAY['fémoro-patellaire', 'rotule', 'douleur antérieure', 'genou', 'valgus', 'rotation interne', 'course', 'escaliers', 'Clarke', 'VMO']
),
(
  'orthopédie', 'diagnostic',
  'Syndrome de la bandelette ilio-tibiale',
  'Le syndrome de la bandelette ilio-tibiale (SBIT) est la principale cause de douleur latérale de genou chez le coureur. Douleur au tubercule de Gerdy, aggravée par la course à un moment précis (souvent après 20 min). Facteurs podaux : hyperpronation, varus de l''arrière-pied, inégalité de longueur. Test de Ober pour la rétraction. Orthèse : correctif du varus ou de la pronation.',
  ARRAY['bandelette', 'ilio-tibiale', 'SBIT', 'essuie-glace', 'Gerdy', 'coureur', 'genou latéral', 'Ober', 'pronation', 'varus']
),
(
  'orthopédie', 'diagnostic',
  'Épiphysite de croissance (Sever, Osgood-Schlatter)',
  'La maladie de Sever (apophysite du calcanéum) et Osgood-Schlatter (apophysite de la tubérosité tibiale antérieure) sont des épiphysites à rechercher chez l''enfant et l''adolescent sportif. Douleur à la palpation du point d''insertion spécifique, aggravée à l''effort. Traitement : repos relatif, physiothérapie, orthèse avec talonnette (Sever).',
  ARRAY['Sever', 'Osgood-Schlatter', 'apophysite', 'croissance', 'enfant', 'adolescent', 'calcanéum', 'tubérosité tibiale', 'sport', 'talonnette']
),

-- ── POSTUROLOGIE ──────────────────────────────────────────────
(
  'posturologie', 'physiopathologie',
  'Chaîne ascendante podo-pelvienne',
  'La chaîne ascendante podo-pelvienne désigne la transmission des perturbations mécaniques du pied vers le genou, la hanche et le bassin. Un pied en pronation excessive entraîne une rotation interne du tibia, un valgus dynamique du genou, une antéversion du bassin et une hyperlordose lombaire. L''analyse podologique et posturale doit explorer l''ensemble de cette chaîne avant toute correction orthétique.',
  ARRAY['chaîne ascendante', 'podo-pelvienne', 'pronation', 'rotation interne', 'tibia', 'valgus', 'genou', 'bassin', 'antéversion', 'lordose']
),
(
  'posturologie', 'physiopathologie',
  'Capteurs posturaux et bilan postural global',
  'Le bilan postural complet comprend l''analyse statique (verticale de Barré, mesure des longueurs de membres, courbes rachidiennes) et dynamique (analyse de la marche, podoscopie, baropodométrie). Les capteurs posturaux à explorer : le pied, l''œil, le système vestibulaire, les articulations cervicales et le système manducateur (ATM). Une perturbation de l''un peut se manifester à distance.',
  ARRAY['postural', 'global', 'Barré', 'statique', 'dynamique', 'capteurs posturaux', 'pied', 'oeil', 'vestibulaire', 'cervical', 'ATM', 'manducateur']
),
(
  'posturologie', 'physiopathologie',
  'Inégalité de longueur des membres inférieurs (ILMI)',
  'Une ILMI anatomique ou fonctionnelle entraîne une bascule du bassin, une scoliose compensatrice et des contraintes asymétriques sur les genoux et les pieds. La différenciation entre ILMI anatomique (radiologique) et fonctionnelle (liée aux tensions musculaires ou à la pronation) est essentielle pour le plan de traitement.',
  ARRAY['inégalité', 'membres inférieurs', 'ILMI', 'bassin', 'scoliose', 'asymétrie', 'longueur', 'bascule']
),
(
  'posturologie', 'orientation',
  'Lombalgie chronique d''origine podiale',
  'Une lombalgie chronique basse associée à un pied hyperpronateur, une antéversion du bassin et une hyperlordose lombaire peut bénéficier d''une correction orthétique podologique. La chaîne ascendante pied-bassin-rachis est bien documentée. Une réévaluation posturale globale incluant les capteurs visuels et cervicaux est recommandée. Association possible à une ILMI.',
  ARRAY['lombalgie', 'dos', 'rachis', 'bassin', 'antéversion', 'lordose', 'pronation', 'chaîne ascendante', 'orientation']
),

-- ── TESTS CLINIQUES ───────────────────────────────────────────
(
  'podologie', 'test',
  'FPI — Foot Posture Index',
  'Le Foot Posture Index (FPI-6) est un outil clinique validé permettant de quantifier la posture du pied en charge. Il évalue 6 critères : têtes de talus, courbe supra/infra-malléolaire, valgus de calcanéum, éminence talo-naviculaire, congruence de l''arche médiale, abduction/adduction de l''avant-pied. Score normal : 0-5. Score ≥ 6 = pied pronateur. Score négatif = pied supinateur.',
  ARRAY['FPI', 'foot posture index', 'pied', 'posture', 'pronation', 'valgus', 'calcanéum', 'évaluation', 'charge', 'test podologique']
),
(
  'podologie', 'test',
  'Test de Silfverskiöld — évaluation du triceps sural',
  'Le test de Silfverskiöld différencie une raideur du gastrocnémien d''une raideur du soléaire. Protocole : mesurer la dorsiflexion de cheville genou en extension puis genou fléchi à 90°. Si la dorsiflexion augmente genou fléchi de > 10°, la raideur est principalement gastrocnémienne. Seuil : dorsiflexion < 10° en charge = rétraction pathologique. Facteur aggravant de la pronation et des métatarsalgies.',
  ARRAY['Silfverskiöld', 'triceps sural', 'gastrocnémien', 'soléaire', 'dorsiflexion', 'raideur', 'cheville', 'pronation', 'test', 'métatarsalgie']
),
(
  'posturologie', 'test',
  'Test d''appui unipodal',
  'Le test d''appui unipodal évalue le contrôle postural et la stabilité du membre inférieur en charge. Observer : valgus de genou dynamique, effondrement du médio-pied, inclinaison du tronc, signe de Trendelenburg (chute du bassin controlatéral = faiblesse du moyen fessier). Maintien normal ≥ 10 secondes sans oscillations majeures. Ce test aide à identifier les dysfonctions de contrôle moteur.',
  ARRAY['appui unipodal', 'appui monopodal', 'stabilité', 'contrôle postural', 'valgus', 'Trendelenburg', 'moyen fessier', 'équilibre', 'test']
),
(
  'posturologie', 'test',
  'Verticale de Barré',
  'La verticale de Barré est un test postural réalisé le patient debout, bras tendus à l''horizontale, yeux fermés. L''observateur apprécie la déviation des index par rapport à un point de référence. Une déviation unilatérale persistante oriente vers une asymétrie tonique (origine vestibulaire, proprioceptive ou visuelle). Interpréter en corrélation avec d''autres capteurs posturaux.',
  ARRAY['Barré', 'verticale', 'postural', 'vestibulaire', 'proprioceptif', 'déviation', 'asymétrie', 'oculaire', 'test']
),
(
  'podologie', 'test',
  'Test de Jack — mécanisme de Windlass',
  'Le test de Jack évalue l''intégrité du mécanisme de Windlass (fascia plantaire). En surélévant passivement le 1er orteil en dorsiflexion, on doit observer une reformation de l''arche plantaire et une rotation externe du tibia. Si l''arche ne se reforme pas : dysfonction du mécanisme de Windlass, insuffisance du 1er rayon ou fascia plantaire insuffisant. Test réalisé en charge et hors charge.',
  ARRAY['Jack', 'Windlass', 'premier orteil', 'fascia plantaire', 'arche', 'test', 'premier rayon', 'dorsiflexion']
),
(
  'podologie', 'test',
  'Test de Lunge — dorsiflexion en charge',
  'Le test de Lunge mesure la dorsiflexion de cheville en charge. Le patient se tient en fente avant, orteil à distance définie du mur. Distance orteil-mur > 10 cm (ou angle > 35°) = dorsiflexion normale. Plus représentatif que la mesure hors charge. Corrélé à la pronation pédieuse, à la fasciite plantaire et aux métatarsalgies.',
  ARRAY['Lunge', 'dorsiflexion', 'charge', 'cheville', 'pronation', 'fascia plantaire', 'métatarsalgie', 'test']
),
(
  'neuro-postural', 'test',
  'Tests oculomoteurs en posturologie',
  'Les tests oculomoteurs évaluent la coordination œil-posture. Ils comprennent : test de convergence oculaire, test de Maddox, évaluation des saccades et poursuite oculaire, test de couverture (cover test). Une dysfonction oculomotrice peut perturber le contrôle postural et se manifester par des douleurs musculo-squelettiques à distance. À réaliser si suspicion d''origine visuelle dans les troubles posturaux.',
  ARRAY['oculomoteurs', 'yeux', 'oculaire', 'convergence', 'Maddox', 'saccades', 'cover test', 'vision', 'postural', 'test']
),
(
  'neuro-postural', 'test',
  'Test de Fukuda et Romberg postural',
  'Le test de Fukuda (marche sur place yeux fermés, 50 pas) évalue la symétrie vestibulo-spinale : une déviation > 30° oriente vers une asymétrie vestibulaire. Le test de Romberg standard et sensibilisé (pieds joints, yeux fermés, sur mousse) évalue l''intégration vestibulo-proprioceptive. La reproductibilité des anomalies est un critère de validité clinique.',
  ARRAY['Fukuda', 'Romberg', 'vestibulaire', 'proprioceptif', 'postural', 'yeux fermés', 'test', 'neuro-postural']
),

-- ── RED FLAGS ─────────────────────────────────────────────────
(
  'général', 'red_flag',
  'Douleur nocturne intense',
  'Toute douleur nocturne intense, réveillant le patient, non soulagée par le repos ou les antalgiques habituels doit faire éliminer une cause tumorale, infectieuse ou inflammatoire (spondylarthropathie). Orienter vers un médecin pour bilan biologique et imagerie avant d''initier un traitement orthétique.',
  ARRAY['douleur nocturne', 'repos', 'tumorale', 'infectieuse', 'inflammatoire', 'red flag', 'urgence', 'bilan']
),
(
  'général', 'red_flag',
  'Signes neurologiques déficitaires',
  'Des paresthésies, hypoesthésies, déficits moteurs (chute du pied, steppage) ou abolition des réflexes ostéo-tendineux associés à des douleurs nécessitent un avis neurologique ou orthopédique urgent. Peuvent évoquer : canal lombaire étroit, hernie discale compressive, compression nerveuse périphérique (névrome de Morton, canal tarsien, syndrome du nerf fibulaire).',
  ARRAY['neurologique', 'paresthésies', 'déficit moteur', 'steppage', 'réflexes', 'hernie discale', 'canal lombaire', 'névrome', 'urgence', 'red flag']
),
(
  'général', 'red_flag',
  'Gonflement articulaire et chaleur locale',
  'Un gonflement articulaire chaud, rouge, douloureux à la palpation évoque une arthrite infectieuse ou microcristalline (goutte, chondrocalcinose). Ces tableaux nécessitent une prise en charge médicale urgente. L''orthèse est contre-indiquée en phase aiguë inflammatoire.',
  ARRAY['gonflement', 'chaleur', 'arthrite', 'infectieuse', 'goutte', 'chondrocalcinose', 'inflammation', 'red flag']
),
(
  'orthopédie', 'red_flag',
  'Instabilité ligamentaire sévère',
  'Une instabilité ligamentaire sévère (entorse de grade III, rupture du LCA, LCI ou LCE) ou une instabilité chronique invalidante doit être orientée vers un chirurgien orthopédiste avant toute prise en charge conservatrice prolongée. Les orthèses de stabilisation peuvent être posées en attente mais ne remplacent pas un bilan IRM et une consultation spécialisée.',
  ARRAY['instabilité', 'ligamentaire', 'LCA', 'LCI', 'entorse', 'genou', 'chirurgien', 'IRM', 'red flag']
),
(
  'orthopédie', 'red_flag',
  'Fracture de stress suspectée',
  'Une douleur à la palpation osseuse localisée, exacerbée à la mise en charge et survenant chez un sportif avec augmentation récente de charge doit faire suspecter une fracture de stress. Os les plus touchés : métatarses (2e surtout), naviculaire, calcanéum. La radiographie peut être normale dans les premières semaines ; IRM ou scintigraphie osseuse nécessaire. Décharge immédiate.',
  ARRAY['fracture de stress', 'métatarse', 'naviculaire', 'calcanéum', 'sportif', 'charge', 'décharge', 'IRM', 'red flag', 'palpation osseuse']
),

-- ── ORIENTATIONS THÉRAPEUTIQUES ────────────────────────────────
(
  'podologie', 'orthèse',
  'Orthèse plantaire pour valgus d''arrière-pied',
  'L''indication orthétique principale en cas de valgus de l''arrière-pied est le renfort médial avec coin de valgus. L''objectif est de corriger partiellement la pronation sous-talienne, de soutenir l''arche médiale et de réduire la chaîne de contraintes ascendantes. Le matériau, l''épaisseur et le degré de correction dépendent du bilan clinique (souplesse du pied, tolérance, niveau d''activité). Les orthèses semi-rigides ou rigides sont préférées pour la proprioception.',
  ARRAY['orthèse', 'valgus', 'arrière-pied', 'coin médial', 'arche', 'plantaire', 'correction', 'pronation', 'rigide']
),
(
  'podologie', 'orthèse',
  'Orthèse plantaire pour syndrome fémoro-patellaire d''origine podiale',
  'En cas de syndrome fémoro-patellaire d''origine podiale (pronation excessive → rotation interne tibiale → maltracking rotulien), une orthèse plantaire avec contrôle du valgus sous-talien peut réduire significativement la douleur. Combinée à un renforcement du vastus medialis oblique (VMO) et des rotateurs externes de hanche. Délai de réponse : 6 à 12 semaines.',
  ARRAY['fémoro-patellaire', 'rotule', 'orthèse', 'pronation', 'rotation interne', 'VMO', 'renforcement', 'hanche', 'plantaire']
),
(
  'général', 'exercice',
  'Renforcement du moyen fessier',
  'Le renforcement du moyen fessier est essentiel dans les dysfonctions du membre inférieur avec valgus dynamique de genou. Exercices progressifs : élévation latérale en décubitus latéral, abduction avec résistance élastique, pont fessier unilatéral, squats unilatéraux avec contrôle. À intégrer dans tout programme pour pied plat, syndrome fémoro-patellaire, gonarthrose médiale.',
  ARRAY['moyen fessier', 'renforcement', 'hanche', 'abducteur', 'rotateur externe', 'valgus', 'genou', 'exercice', 'pont fessier']
),
(
  'podologie', 'exercice',
  'Renforcement du tibial postérieur',
  'Le renforcement du tibial postérieur est central dans la prise en charge du pied plat acquis (TPVD stade 1-2). Exercices : élévation sur la pointe des pieds en supination (heel rises en appui médial), marche sur la pointe des pieds en inversion, exercices excentrico-concentriques. Associer des étirements du triceps sural si rétraction.',
  ARRAY['tibial postérieur', 'renforcement', 'pied plat', 'TPVD', 'supination', 'pointe des pieds', 'exercice', 'excentrique', 'inversion']
),
(
  'podologie', 'exercice',
  'Étirement du triceps sural',
  'L''étirement du triceps sural (gastrocnémien + soléaire) est indiqué en cas de rétraction documentée (test de Silfverskiöld positif). Gastrocnémien : genou en extension, inclinaison du tronc en avant, pied en légère supination. Soléaire : genou fléchi, même posture. 3 × 30 secondes, 3 fois par jour. La rétraction favorise la pronation compensatrice et les métatarsalgies.',
  ARRAY['triceps sural', 'étirement', 'gastrocnémien', 'soléaire', 'rétraction', 'Silfverskiöld', 'exercice', 'pronation', 'métatarsalgie']
),
(
  'général', 'exercice',
  'Travail proprioceptif et équilibre unipodal',
  'Les exercices proprioceptifs sur surface instable (plateau de Freeman, coussin mousse, disque d''équilibre) améliorent le contrôle postural et réduisent le risque de récidive de l''entorse. Progresser de : appui bipodal stable → unipodal stable → unipodal instable → tâche dual-task. Durée recommandée : 10-15 min/jour.',
  ARRAY['proprioception', 'équilibre', 'unipodal', 'Freeman', 'instable', 'exercice', 'entorse', 'valgus', 'postural', 'dual-task']
),
(
  'général', 'orientation',
  'Orientation kinésithérapeutique',
  'L''orientation vers un kinésithérapeute est recommandée pour : renforcement musculaire ciblé (moyen fessier, tibial postérieur, soléaire), travail proprioceptif, rééducation posturale globale (RPG), étirements analytiques ou globaux, techniques manuelles (mobilisations articulaires, thérapies myo-fasciales). La prescription doit indiquer la problématique principale et les axes de travail.',
  ARRAY['kinésithérapie', 'rééducation', 'RPG', 'proprioception', 'renforcement', 'étirement', 'manuel', 'orientation']
),
(
  'général', 'orientation',
  'Imagerie et examens complémentaires',
  'Selon le tableau clinique, orienter vers : radiographies de face et profil en charge (pied, genou, rachis lombaire) pour quantifier les déformations osseuses ; IRM si suspicion de lésion ligamentaire, méniscale, tendineuse ou de fracture de stress ; échographie pour les tendons (Achille, tibial postérieur, fascia plantaire) ; bilan biologique si suspicion d''arthrite inflammatoire.',
  ARRAY['imagerie', 'radiographie', 'IRM', 'échographie', 'bilan biologique', 'examens complémentaires', 'arthrite', 'ligament', 'ménisque']
),

-- ── NEURO-POSTURAL ─────────────────────────────────────────────
(
  'neuro-postural', 'physiopathologie',
  'Réflexes archaïques non intégrés',
  'Les réflexes archaïques (RTCA, Moro, RTCL, tonique labyrinthique) normalement intégrés dans les 12-18 premiers mois peuvent persister chez l''adulte et perturber le contrôle postural, la coordination et le tonus musculaire. Leur non-intégration peut se manifester par des troubles posturaux atypiques, des hypersensibilités, des difficultés de concentration. L''approche neuro-posturo-développementale peut être indiquée.',
  ARRAY['réflexes archaïques', 'Moro', 'RTCA', 'RTCL', 'tonique labyrinthique', 'intégration', 'postural', 'coordination', 'neuro-postural']
);
