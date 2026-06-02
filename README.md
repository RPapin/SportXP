# ObjectifMilliardXP — Application Strava gamifiée

Application web qui gamifie les activités Strava en attribuant des XP basés sur la distance et le dénivelé.

## Stack

| Couche | Technologie |
|--------|------------|
| Frontend | Angular 17 standalone, Angular Material, Leaflet.js |
| Backend | NestJS, TypeORM, Passport.js OAuth2 Strava |
| Base de données | PostgreSQL 16 + PostGIS 3 |
| Auth | OAuth 2.0 Strava (JWT) |
| Infra | Docker Compose |

## Première installation

### Installer PostGIS sur PostgreSQL local

PostGIS doit être installé au niveau système avant de pouvoir être activé dans la base de données.

#### Via Stack Builder (recommandé sur Windows)

1. Ouvrir **Stack Builder** (menu Démarrer → chercher "Stack Builder")
2. Sélectionner votre instance PostgreSQL → Suivant
3. Déplier **Spatial Extensions** → cocher **PostGIS** → Installer

#### Via pgAdmin

Une fois les fichiers installés, ouvrir **pgAdmin** → se connecter au serveur → clic droit sur la base `stravaxp` → **Query Tool**, puis exécuter :

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Vérification :

```sql
SELECT PostGIS_version();
-- ex : 3.4 USE_GEOS=1 ...
```

#### Via la ligne de commande

```bash
psql -U stravaxp_user -d stravaxp -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

#### Dépannage

| Erreur | Solution |
|--------|----------|
| `could not open extension control file` | Les fichiers PostGIS ne sont pas installés — relancer Stack Builder |
| `permission denied` | Se connecter en superutilisateur (`postgres`) pour exécuter `CREATE EXTENSION` |
| Version incompatible | Vérifier que la version PostGIS correspond à celle de PostgreSQL (ex : PostGIS 3.4 pour PG 16) |

---

## Démarrage rapide

### 1. Variables d'environnement

```bash
cp backend/..env.example backend/..env
# Remplir STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, JWT_SECRET
```

### 2. Docker Compose (recommandé)

```bash
docker-compose up -d
```

- API : http://localhost:3000
- Frontend : http://localhost:4200
- Nginx proxy : http://localhost:80

### 3. Développement local

**Base de données PostgreSQL + PostGIS :**
```bash
docker-compose up db -d
```

**Backend :**
```bash
cd backend
npm install
npm run start:dev
```

**Frontend :**
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

## Formule XP

```
XP = (distance_m / 100) × |average_grade_percent|
```

Si le grade est null : coefficient = 1 (XP = distance_m / 100).

## Courbe de niveau

```
XP requis pour le niveau N = 100 × N^1.5
```

| Niveau | XP requis |
|--------|-----------|
| 1 | 100 |
| 5 | 1 118 |
| 10 | 3 162 |
| 20 | 8 944 |

## Pages

| Route | Description | Auth requise |
|-------|-------------|--------------|
| `/home` | Feed des activités récentes | Non |
| `/map` | Carte interactive des tracés | Oui |
| `/profile` | Profil personnel, XP, achievements | Oui |
| `/leaderboard` | Classement des athlètes | Oui |
| `/admin` | Administration | Admin uniquement |

## Endpoints API principaux

```
GET  /api/auth/strava              → OAuth redirect
GET  /api/auth/strava/callback     → OAuth callback
GET  /api/auth/me                  → Profil connecté
GET  /api/activities               → Feed global
GET  /api/activities/map           → GeoJSON tracés
GET  /api/activities/mine          → Mes activités
POST /api/activities/sync-all      → Import complet Strava
GET  /api/users/leaderboard        → Classement
GET  /api/webhooks/strava          → Validation hub Strava
POST /api/webhooks/strava          → Events Strava temps réel
```

## Structure du projet

```
/
├── backend/          # NestJS API
│   └── src/
│       ├── auth/         # OAuth Strava + JWT
│       ├── activities/   # XP, webhook, import
│       ├── users/        # Profil, leaderboard
│       ├── achievements/ # Engine badges
│       ├── admin/        # CRUD admin
│       ├── websocket/    # Socket.io gateway
│       └── database/     # Entités TypeORM
├── frontend/         # Angular 17
│   └── src/app/
│       ├── core/         # Guards, interceptors, services
│       ├── shared/       # Pipes XP, LevelBar
│       └── features/     # home, map, profile, leaderboard, admin
└── docker-compose.yml
```

## Webhook Strava

Enregistrer le webhook via l'API Strava :
```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=VOTRE_CLIENT_ID \
  -F client_secret=VOTRE_CLIENT_SECRET \
  -F callback_url=https://VOTRE_DOMAINE/api/webhooks/strava \
  -F verify_token=VOTRE_VERIFY_TOKEN
```
