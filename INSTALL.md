# Althea — Installation et démarrage

## Prérequis
- Node.js 18+
- Un compte Supabase (gratuit) : https://app.supabase.com
- Une clé API OpenAI : https://platform.openai.com/api-keys

---

## 1. Installer les dépendances

```bash
npm install
```

---

## 2. Configurer Supabase

### 2a. Créer un projet Supabase
1. Allez sur https://app.supabase.com
2. Créez un nouveau projet
3. Notez votre **URL** et votre **anon key** (Settings > API)

### 2b. Créer les tables
1. Dans Supabase, allez dans **SQL Editor**
2. Copiez-collez le contenu de `supabase/migrations/001_initial.sql`
3. Cliquez **Run**

### 2c. Créer votre compte utilisateur
1. Dans Supabase, allez dans **Authentication > Users**
2. Cliquez **Add user** → **Create new user**
3. Saisissez votre email et un mot de passe

---

## 3. Configurer les variables d'environnement

Copiez le fichier exemple :
```bash
cp .env.local.example .env.local
```

Remplissez `.env.local` avec vos vraies valeurs :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ Ne commitez jamais `.env.local` — il est déjà dans `.gitignore`

---

## 4. Lancer en développement

```bash
npm run dev
```

Ouvrez http://localhost:3000 — vous serez redirigé vers la page de login.

---

## 5. Déployer sur Vercel (recommandé)

```bash
npm install -g vercel
vercel
```

Ou directement depuis https://vercel.com/new en important le repo GitHub.

**Variables d'environnement à configurer sur Vercel :**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL` → votre URL Vercel (ex: https://althea.vercel.app)

**Dans Supabase**, ajoutez votre URL Vercel dans :
Authentication > URL Configuration > Site URL

---

## Architecture des fichiers

```
althea/
├── app/
│   ├── (auth)/login/          # Page de connexion
│   ├── (dashboard)/           # Zone authentifiée
│   │   ├── page.tsx           # Tableau de bord
│   │   ├── patients/          # Gestion patients
│   │   │   ├── page.tsx       # Liste
│   │   │   ├── new/           # Créer patient
│   │   │   └── [id]/          # Fiche patient + bilans
│   │   │       └── bilan/
│   │   │           ├── new/   # Nouveau bilan
│   │   │           └── [id]/  # Bilan existant
│   │   ├── bilans/            # Tous les bilans
│   │   └── settings/          # Paramètres
│   ├── api/
│   │   ├── patients/          # CRUD patients
│   │   ├── bilans/            # CRUD bilans
│   │   ├── generate/          # Génération IA
│   │   └── pdf/               # Upload et extraction PDF
│   └── auth/callback/         # Callback Supabase Auth
├── components/
│   ├── layout/                # Sidebar, Header
│   ├── bilan/                 # BilanEditor, sections, dictée vocale
│   └── pdf/                   # Upload PDF
├── lib/
│   ├── supabase/              # Clients Supabase (client/server/middleware)
│   └── openai/                # Client OpenAI + construction des prompts
├── types/                     # Types TypeScript globaux
└── supabase/migrations/       # SQL d'initialisation
```

---

## Prochaines évolutions prévues (V2)

- [ ] Export PDF / DOCX du compte rendu
- [ ] Templates de sections cliquables
- [ ] Plusieurs types de comptes rendus (bilan postural, podologique, etc.)
- [ ] Enrichissement contextuel par base documentaire (RAG)
- [ ] Multi-praticiens / cabinet partagé
- [ ] Envoi email du compte rendu
- [ ] Dashboard statistique (patients/mois, bilans/semaine)
- [ ] OCR pour PDF scannés (via Tesseract ou API vision)
