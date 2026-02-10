# 🏠 Plateforme Immobilière - Phase 0

Plateforme de publication de biens immobiliers avec profils utilisateurs.

## 📋 Prérequis

Vous devez installer ces logiciels avant de commencer :

### 1. Python 3.10+
- **Télécharger** : https://www.python.org/downloads/
- ✅ **Important** : Cochez "Add Python to PATH" lors de l'installation
- **Vérifier** : `python --version`

### 2. Node.js 18+ & npm
- **Télécharger** : https://nodejs.org/ (version LTS recommandée)
- **Vérifier** : `node --version` et `npm --version`

### 3. PostgreSQL 16+
- **Télécharger** : https://www.postgresql.org/download/
- **Alternative facile** : Utiliser Railway.app ou Supabase (cloud gratuit)

---

## 🚀 Installation

### Backend Django

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Créer un environnement virtuel Python
python -m venv venv

# 3. Activer l'environnement virtuel
# Sur Windows :
venv\Scripts\activate
# Sur Mac/Linux :
source venv/bin/activate

# 4. Installer les dépendances
pip install -r requirements.txt

# 5. Créer le fichier .env (à configurer)
# Voir section Configuration ci-dessous
```

### Frontend React

```bash
# 1. Aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances npm
npm install

# 3. Créer le fichier .env (à configurer)
# Voir section Configuration ci-dessous
```

---

## ⚙️ Configuration

### Backend (.env)

Créez un fichier `backend/.env` :

```env
# Django
SECRET_KEY=votre-cle-secrete-django-a-generer
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database PostgreSQL
DATABASE_NAME=realestate_db
DATABASE_USER=postgres
DATABASE_PASSWORD=votre_mot_de_passe
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Cloudinary (pour les images)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env)

Créez un fichier `frontend/.env` :

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🏃 Lancer le Projet

### 1. Lancer le Backend

```bash
cd backend

# Activer l'environnement virtuel
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Mac/Linux

# Créer la base de données (première fois seulement)
python manage.py migrate

# Créer un super utilisateur (admin)
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

Backend accessible sur : **http://localhost:8000**
Admin Django : **http://localhost:8000/admin**

### 2. Lancer le Frontend

```bash
cd frontend

# Lancer le serveur de développement
npm run dev
```

Frontend accessible sur : **http://localhost:5173**

---

## 📁 Structure du Projet

```
realestateplatform/
├── backend/                 # Django REST API
│   ├── config/             # Configuration Django
│   ├── apps/
│   │   ├── users/          # Gestion utilisateurs
│   │   ├── properties/     # Gestion biens immobiliers
│   │   └── favorites/      # Système de favoris
│   ├── requirements.txt    # Dépendances Python
│   └── .env               # Variables d'environnement
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── pages/         # Pages principales
│   │   ├── components/    # Composants réutilisables
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API calls
│   │   └── context/       # React Context
│   ├── package.json       # Dépendances npm
│   └── .env              # Variables d'environnement
│
└── README.md             # Ce fichier
```

---

## 🎯 Fonctionnalités Phase 0

- ✅ Inscription/Connexion utilisateurs
- ✅ Profils utilisateurs (avatar, bio)
- ✅ Publication de biens immobiliers
- ✅ Upload d'images (Cloudinary)
- ✅ Recherche et filtres
- ✅ Page détail d'un bien
- ✅ Système de favoris
- ✅ Interface responsive

---

## 🔧 Commandes Utiles

### Backend
```bash
# Créer une nouvelle migration
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un super utilisateur
python manage.py createsuperuser

# Lancer les tests
pytest

# Lancer le shell Django
python manage.py shell
```

### Frontend
```bash
# Installer une nouvelle dépendance
npm install nom-du-package

# Build pour production
npm run build

# Preview du build
npm run preview

# Linter
npm run lint
```

---

## 📚 Technologies Utilisées

### Backend
- Django 5.0
- Django REST Framework
- PostgreSQL
- Cloudinary
- JWT Authentication

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Query
- React Router
- Axios
- Leaflet (cartes)

---

## 🆘 Aide

Si vous rencontrez des problèmes :

1. **Python non trouvé** : Vérifiez que Python est dans le PATH
2. **Node non trouvé** : Réinstallez Node.js
3. **Erreur de migration** : Supprimez le dossier `migrations/` et refaites les migrations
4. **Port déjà utilisé** : Changez le port dans les commandes (`runserver 8001`, `vite --port 5174`)

---

## 📝 Prochaines Étapes

Une fois que tout fonctionne :

1. Configurer Cloudinary (gratuit)
2. Créer les modèles Django
3. Créer les APIs REST
4. Développer le frontend React
5. Tester et déployer

---

## 🚀 Statut Actuel

**Phase 0 en cours de développement**

Projet initialisé ✅
Configuration des fichiers ✅
Installation des dépendances : ⏳ (en attente de Python/Node.js)

---

Bon développement ! 💻
