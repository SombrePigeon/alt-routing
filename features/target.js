
import namings from "../namings.js";
import config from "alt-routing/config";

const updateTarget = (e) =>
{
    const route = e.target;
    if(route.state === namings.enums.state.loaded
        || route.state === namings.enums.state.unloading)
    {
        const hash = location.hash.substring(1);
        //recherche uniquement dans la route
        //toDo is for --state syntax fallback
        const matchSelector = 
        [
            `:state(${Symbol.keyFor(namings.enums.locationMatch.exact)})`,
            `:--state(${Symbol.keyFor(namings.enums.locationMatch.exact)})`,
            `[location-match="${Symbol.keyFor(namings.enums.locationMatch.exact)}"]`
        ];
        const newTarget = route.querySelector(`:scope:is(${matchSelector}) [id="${hash}"]:not(:is(${matchSelector}) ${namings.components.route} [id="${hash}"])`);
        const oldTarget = route.querySelector(`:scope .${namings.classes.altTarget}:not(:scope ${namings.components.route} *)`);
        
        if(oldTarget && oldTarget !== newTarget)
        {
            oldTarget.classList.remove(namings.classes.altTarget)
        }
        newTarget && (newTarget.classList.add(namings.classes.altTarget));
        newTarget?.scrollIntoView();
    }
}

const connectToRoute = (e) =>
{
    const route = e.target;
    if(route.tagName === namings.components.route.toLocaleUpperCase())
    {
        e.target.addEventListener(namings.events.loaded, 
            updateTarget);
        e.target.addEventListener(namings.events.routeChange, 
            updateTarget);
        const disconnectController = new AbortController(); 
        route.addEventListener(namings.events.disconnectComponent,
            (e) =>
            {
                disconnectController.abort();
            }
        );
        //pas très beau
        window.addEventListener("hashchange", 
            ()=> {updateTarget(e)},
            {
                signal: disconnectController.signal
            }
        );
        
    }
};

export function addUpdateTarget(component)
{
    component.addEventListener(namings.events.connectComponent, 
        connectToRoute,
        {
            capture: true,
        });
};

console.debug("styleRoutes module");
