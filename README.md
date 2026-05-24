# Alt-routing

## Utilisation avec un service worker

Il est possible d'utiliser la puissance des service workers pour charger alt-routing, le mettre en cache et l'utiliser hors ligne.

### Prérequis
Prenez le temps de lire globalement comment fonctionnent les service workers.

[MDN](https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API) est une bonne référence, remplie d'exemples.

### Installation
Pour cela, il vous suffit d'importer dans votre service worker le module `serviceWorker.js` et d'appeler la fonction `install()` :

```mjs
import { install as installAltRouting } from "http://alt-routing.dev.releases.sombrepigeon.fr/serviceWorker.js";

installAltRouting();
```

Cela ajoutera les listeners des événements `install`, `fetch` et `activate`.

### Mise en cache
Lors de l'événement `install`, les fichiers sont stockés dans des caches sous la forme : `cacheName`/`version`, où `cacheName` vaut `"alt-routing"` et `version` correspond à la version d'AltRouting importée.

S'il existe déjà la bonne version de la lib en cache, elle sera utilisée.

### Activation du service worker
À l'activation du service worker, les anciennes versions d'alt-routing seront supprimées du cache.

### Capture des requêtes
Une fois le service worker activé, toutes les requêtes `fetch` et `import` effectuées par des documents contrôlés par le service worker seront servies depuis le cache pour la partie lib d'alt-routing.

### Changement de contrôleur
Si le contrôleur d'un document change (via `skipWaiting()` par exemple) et qu'un `alt-router` est actif, la navigation ne sera pas interceptée et se fera de manière classique. Cela permet de mettre à jour le document sans forcer un rechargement qui serait désagréable pour l'utilisateur.

Si néanmoins vous souhaitez forcer le rechargement dès le changement de contrôleur, il existe un événement `controllerchange` sur l'objet `navigator.serviceWorker` (voir [ici](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controllerchange_event)).

### Attention
Si vous changez le nom du cache (ce qui est à éviter autant que possible), il vous revient de supprimer vous-même les anciennes versions.

Seuls les fichiers de la lib sont mis en cache. Si vous remplacez des fichiers comme `config.json` ou `composition.json`, vous devrez vous-même les mettre en cache et les servir via le service worker.