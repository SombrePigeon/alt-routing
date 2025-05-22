
import namings from "../namings.js";
import config from "alt-routing/config";

const updateTarget = (route) =>
{
    if(route.state === namings.enums.state.loaded
        || route.state === namings.enums.state.unloading)
    {
        const hash = location.hash.substring(1);
        //recherche uniquement dans la route
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
        console.log("scroll")
    }
}

const connectToRoute = (e) =>
{
    const route = e.target;
    if(route.tagName === namings.components.route.toLocaleUpperCase())
    {
        route.addEventListener(namings.events.loaded, 
            ()=> 
            {
                updateTarget(route)
            }
        );
        route.addEventListener(namings.events.routeChange, 
            ()=> 
            {
                updateTarget(route)
            }
        );
        
        const disconnectController = new AbortController(); 
        route.addEventListener(namings.events.disconnectComponent,
            (e) =>
            {
                disconnectController.abort();
            }
        );
        window.addEventListener("hashchange", 
            ()=> {updateTarget(route)},
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
