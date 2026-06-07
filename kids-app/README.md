# 🌟 Mon Petit Génie

Une application ludique et **100 % hors-ligne** pour les enfants à partir de **3 ans**,
qui aide à découvrir **l'alphabet** et **les chiffres** tout en stimulant les
**fonctions cognitives** (mémoire, attention, reconnaissance des formes et des couleurs).

L'interface est en **français** et l'application **parle** (synthèse vocale du navigateur)
pour accompagner l'enfant même s'il ne sait pas encore lire.

## 🎮 Les jeux

| Jeu | Compétence travaillée |
|-----|-----------------------|
| 🔤 **Alphabet** | Reconnaître les 26 lettres + un mot et une image par lettre |
| 🔢 **Les Chiffres** | Compter de 1 à 10, associer un chiffre à une quantité de points |
| 🧠 **Memory** | Mémoire de travail et concentration (retrouver les paires) |
| 🔎 **Trouve la lettre** | Reconnaissance visuelle et auditive des lettres |
| 🎯 **Trouve le chiffre** | Reconnaissance des chiffres |
| 🎨 **Les Couleurs** | Apprendre et distinguer les couleurs |

Chaque bonne réponse déclenche des **encouragements parlés** et une petite
animation de **confettis** pour garder l'enfant motivé.

## ▶️ Comment l'utiliser

Aucune installation, aucune connexion internet nécessaire.

1. Ouvre simplement le fichier **`index.html`** dans un navigateur
   (Chrome, Safari, Firefox, Edge), sur **ordinateur, tablette ou téléphone**.
2. C'est tout ! Touche un jeu pour commencer.

> 💡 **Astuce tablette/téléphone** : ajoute la page à l'écran d'accueil
> (« Ajouter à l'écran d'accueil ») pour l'ouvrir comme une vraie application,
> en plein écran.

### Lancer un petit serveur (optionnel)

Sur certains navigateurs la voix fonctionne mieux via un serveur local :

```bash
cd kids-app
python3 -m http.server 8000
# puis ouvre http://localhost:8000 dans le navigateur
```

## 🔊 Le son

Le bouton 🔊 en haut à droite permet de **couper / réactiver** la voix.
La voix utilise les voix françaises installées sur l'appareil ; si aucune voix
française n'est disponible, l'application reste entièrement jouable visuellement.

## 👨‍👩‍👧 Conseils aux parents

- Idéal pour des sessions **courtes (5–10 min)** adaptées à l'attention d'un enfant de 3 ans.
- Accompagnez votre enfant les premières fois, puis laissez-le explorer.
- L'application ne collecte **aucune donnée** et ne contient **aucune publicité**.

## 🛠️ Détails techniques

- HTML / CSS / JavaScript purs, **sans dépendance**.
- Voix via l'API **Web Speech** du navigateur.
- Fichiers : `index.html`, `style.css`, `app.js`.
