# Alt-routing

## Utiliser avec un service worker

Il est possible d'utiliser la puissance des services workers pour charger alt-routing pour mettre en cache et utiliser hors ligne.

### Prérequis
Prennez le temps de lire globalement comment fonctionnent les services worker.

[MDN](https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API) et une bonne référence remplie d'exemples


### Installer
Pour celà il vous suffi importer dans votre serviceworker le module serviceWorker.js et d'appeller la fonction `install()` :

```mjs
import {install as installAltRouting} from "http://alt-routing.dev.releases.sombrepigeon.fr/serviceWorker.js";

installAltRouting();
```

Celà ajoutera les listeners des event `install` `fetch` et `activate`.


### Mise en cache
Lors de l'envent `install`, les fichiers sont stocké dans des caches sous la forme : `cacheName`/`version` où `cacheName` vaut "alt-routing" et `version` est la version de altRouting importée.

Si il existe déjà la bonne version de la lib en cache, elle sera utilisée.

### Activation du serviceworker
à l'activation du service worker, les anciennes versions de alt-routing seront vidées du cache.

### Capture des requettes
Une fois le service worker activé, toutes les requettes `fetch` et `import` qui sont faites par des documents contrôlés par le service worker seront répondus depuis le cache pour la partie lib de alt-routing.

### Changement de Controller
Si le contrôller d'un document change (via `skipWaiting()` par exemple) et qu'un `alt-routeur` est actif, la navigation ne sera pas interceptée et se fera de manière classique. Cela permet de mettre à jour le document sans forcer un reload qui serait désagrable pour l'utilisateur.

Si néanmoins vois souhaitez forcer le reload dés le changement de controller, il existe un evenement `controllerchange` sur l'objet `navigator.serviceWorker` (voir [içi](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controllerchange_event))

### Attention 
Si vous changer le nom du cache (ce qui est à éviter autant que possible) il vous revient de supprimer vous même les anciennes versions.

Seul les fichiers de la lib sont mis en cache, si vous remplacez des fichiers comme `config.json` ou `composition.json`, vous devrez vous même les metres en cache et les servir via le service worker 
