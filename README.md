# MeloStream

MeloStream est une application web full-stack de streaming musical realisee dans
le cadre d'un Projet de Fin de Module. Elle propose une experience simple pour
rechercher des titres, ecouter des extraits, gerer des favoris, organiser des
playlists, partager un titre et administrer les utilisateurs.

Le projet est compose de deux parties principales:

- `backend`: API REST securisee developpee avec Spring Boot.
- `frontend`: application web developpee avec Angular.

Le rapport complet du livrable est disponible ici:

- Version PDF: `rapport/rapport.pdf`
- Source LaTeX: `rapport/rapport.tex`

## Table des matieres

- [Objectif du projet](#objectif-du-projet)
- [Fonctionnalites](#fonctionnalites)
- [Architecture](#architecture)
- [Technologies utilisees](#technologies-utilisees)
- [Structure du projet](#structure-du-projet)
- [Installation et lancement](#installation-et-lancement)
- [Configuration](#configuration)
- [API REST principale](#api-rest-principale)
- [Verification](#verification)
- [Livrables](#livrables)
- [Limites et perspectives](#limites-et-perspectives)

## Objectif du projet

La problematique du projet est de concevoir une plateforme musicale pedagogique
capable de centraliser la recherche, l'ecoute d'extraits, les favoris, les
playlists, le partage et l'administration, tout en gardant une architecture
claire entre frontend, backend, base de donnees et API musicales externes.

Les objectifs principaux sont:

- mettre en place une application Angular connectee a une API Spring Boot;
- proteger les routes privees par authentification et roles;
- persister les donnees utilisateur dans MySQL;
- integrer des sources musicales externes;
- fournir un livrable documente avec rapport, diagrammes et captures d'ecran.

## Fonctionnalites

### Utilisateur

- Creation de compte et connexion.
- Consultation et modification du profil.
- Recherche de titres par mot-cle.
- Affichage des titres avec pochette, artiste, album et duree.
- Lecture audio depuis le catalogue, les favoris ou les playlists.
- Passage automatique au titre suivant dans une playlist.
- Navigation avec boutons precedent et suivant.
- Ajout et suppression de favoris.
- Creation, renommage et suppression de playlists.
- Ajout et retrait de titres dans une playlist.
- Partage d'un titre avec un lien direct.

### Administrateur

- Consultation des statistiques globales.
- Consultation de la liste des utilisateurs.
- Modification du role d'un utilisateur.
- Suppression d'un utilisateur.

### Documentation API

- Documentation OpenAPI accessible avec Swagger UI.
- Endpoints classes par module: authentification, titres, favoris, playlists et
  administration.

## Architecture

<img src="rapport/images/ChatGPT Image 7 juin 2026, 22_28_08.png" alt="Architecture technique de MeloStream" width="100%">

L'architecture separe les responsabilites principales:

- Angular gere l'interface utilisateur et le lecteur audio.
- Le frontend communique avec le backend via les routes `/api`.
- Spring Boot expose les endpoints REST et applique les regles metier.
- Spring Security protege les routes privees et les routes administrateur.
- MySQL stocke les utilisateurs, jetons, favoris et playlists.
- Deezer fournit les donnees musicales principales.
- Jamendo peut etre active comme source musicale optionnelle.

## Technologies utilisees

| Partie | Technologies |
| --- | --- |
| Backend | Java 21, Spring Boot 4.0.6, Spring Web MVC, Spring Security, Spring Data JPA, Validation |
| Frontend | Angular 21, TypeScript 5.9, CSS responsive |
| Base de donnees | MySQL, phpMyAdmin |
| Documentation API | Springdoc OpenAPI 3.0.3, Swagger UI |
| Tests | Spring Boot Test, Angular cote frontend |
| API musicale | Deezer public API, Jamendo API optionnelle |

## Structure du projet

```text
MeloStream/
  backend/
    src/main/java/com/musicstream/
      admin/
      auth/
      config/
      deezer/
      favorites/
      jamendo/
      music/
      playlists/
      security/
    src/main/resources/application.yml
    pom.xml

  frontend/
    src/app/
      admin-api.ts
      api-url.ts
      app.css
      app.html
      app.ts
      auth-api.ts
      favorite-api.ts
      music-api.ts
      playlist-api.ts
    proxy.conf.json
    package.json

  rapport/
    images/
    plantuml/
    rapport.tex
    rapport.pdf

  README.md
```

## Installation et lancement

### Prerequis

- Java 21.
- Node.js compatible avec Angular 21.
- npm.
- MySQL local.
- phpMyAdmin optionnel.

### Lancer le backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

L'API sera disponible sur:

```text
http://localhost:8080
```

La documentation Swagger sera disponible sur:

```text
http://localhost:8080/swagger-ui.html
```

### Lancer le frontend

```powershell
cd frontend
npm install
npm start
```

L'application sera disponible sur:

```text
http://localhost:4200
```

Le fichier `frontend/proxy.conf.json` redirige automatiquement les appels
`/api` vers `http://localhost:8080`.

## Configuration

### MySQL

Configuration locale par defaut:

```text
database: music_stream
username: root
password: vide
```

URL JDBC utilisee par le backend:

```text
jdbc:mysql://localhost:3306/music_stream?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

La base `music_stream` est creee automatiquement si elle n'existe pas.

### Jamendo optionnel

Deezer est utilise par defaut. Pour activer Jamendo, definir la variable
d'environnement suivante avant de lancer le backend:

```powershell
$env:JAMENDO_CLIENT_ID="ton_client_id_jamendo"
```

### Securite

- Les routes `POST /api/auth/register` et `POST /api/auth/login` sont publiques.
- Les autres routes `/api/**` necessitent un jeton d'authentification.
- Les routes `/api/admin/**` necessitent le role `ADMIN`.
- Les mots de passe sont stockes sous forme de hash.
- L'application backend fonctionne en mode stateless.
- Les origines CORS autorisees sont `http://localhost:4200` et
  `http://127.0.0.1:4200`.

## API REST principale

| Methode | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Creer un compte utilisateur. |
| `POST` | `/api/auth/login` | Se connecter. |
| `GET` | `/api/auth/me` | Recuperer l'utilisateur connecte. |
| `PUT` | `/api/auth/profile` | Modifier le profil. |
| `POST` | `/api/auth/logout` | Se deconnecter. |
| `GET` | `/api/tracks` | Rechercher des titres. |
| `GET` | `/api/tracks/{source}/{trackId}` | Charger un titre par source et identifiant. |
| `GET` | `/api/favorites` | Lister les favoris. |
| `POST` | `/api/favorites` | Ajouter un favori. |
| `DELETE` | `/api/favorites/{trackId}` | Supprimer un favori. |
| `GET` | `/api/playlists` | Lister les playlists. |
| `POST` | `/api/playlists` | Creer une playlist. |
| `PUT` | `/api/playlists/{playlistId}` | Renommer une playlist. |
| `DELETE` | `/api/playlists/{playlistId}` | Supprimer une playlist. |
| `POST` | `/api/playlists/{playlistId}/tracks` | Ajouter un titre a une playlist. |
| `DELETE` | `/api/playlists/{playlistId}/tracks/{source}/{trackId}` | Retirer un titre d'une playlist. |
| `GET` | `/api/admin/stats` | Consulter les statistiques administrateur. |
| `GET` | `/api/admin/users` | Lister les utilisateurs. |
| `PUT` | `/api/admin/users/{userId}/role` | Modifier le role d'un utilisateur. |
| `DELETE` | `/api/admin/users/{userId}` | Supprimer un utilisateur. |

## Verification

### Tests backend

```powershell
cd backend
.\mvnw.cmd test
```

### Tests frontend

```powershell
cd frontend
npm test -- --watch=false
```

### Build frontend

```powershell
cd frontend
npm run build
```

### Compilation du rapport

```powershell
cd rapport
tectonic rapport.tex
```

## Livrables

| Element | Emplacement |
| --- | --- |
| Code backend | `backend/` |
| Code frontend | `frontend/` |
| Rapport PDF | `rapport/rapport.pdf` |
| Rapport LaTeX | `rapport/rapport.tex` |
| Diagrammes | `rapport/plantuml/` et `rapport/images/` |
| Captures d'ecran | `rapport/images/` |
| Documentation du projet | `README.md` |

## Limites et perspectives

### Limites actuelles

- Deezer fournit principalement des extraits audio, pas un streaming commercial
  complet.
- Les liens de partage dependent de la disponibilite du titre dans l'API source.
- La configuration est preparee pour un environnement local.
- Les captures doivent etre regenerees si l'interface change fortement.

### Perspectives

- Ajouter une route Angular dediee aux titres partages.
- Ajouter plus de tests d'integration sur les endpoints critiques.
- Preparer un deploiement avec variables d'environnement separees.
- Ajouter une pagination avancee pour les grands catalogues.
- Enrichir Swagger avec des exemples de requetes et de reponses.
- Verifier les conditions d'utilisation des API musicales avant une mise en
  production.

## Conclusion

MeloStream repond aux objectifs du projet en proposant une application web
complete, securisee et connectee a une base MySQL. Le livrable contient le code
source, la documentation technique, les diagrammes, les captures d'ecran et le
rapport PFM finalise.
