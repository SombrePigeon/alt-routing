
import namings from "../namings.js";

console.info("alt-routing module init : feature/target");

const updateTarget = (route) =>
{
    if(route.state === namings.enums.state.loaded
        || route.state === namings.enums.state.unloading)
    {
        const hash = location.hash.substring(1);
        //recherche uniquement dans la route
        const matchSelector = 
        [
            `:state(${namings.enums.locationMatch.exact})`,
            `:--state(${namings.enums.locationMatch.exact})`,
            `[location-match="${namings.enums.locationMatch.exact}"]`
        ];
        const newTarget = route.querySelector(`:scope:is(${matchSelector}) [id="${hash}"]:not(:is(${matchSelector}) ${namings.components.route} [id="${hash}"])`);
        const oldTarget = route.querySelector(`:scope .${namings.classes.altTarget}:not(:scope ${namings.components.route} *)`);
        
        if(oldTarget && oldTarget !== newTarget)
        {
            oldTarget.classList.remove(namings.classes.altTarget)
        }
        newTarget?.classList.add(namings.classes.altTarget);
        newTarget?.scrollIntoView();
    }
}

const connectToRoute = (e) =>
{
    const route = e.target;
    const router = route.router;
    if(route.tagName === namings.components.route.toLocaleUpperCase())
    {
        route.addEventListener(namings.events.loaded, 
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
        router.addEventListener(namings.events.routeChange, 
            ()=> 
            {
                updateTarget(route)
            },
            {
                signal: disconnectController.signal
            }
        );
        window.addEventListener("hashchange", 
            ()=> 
            {
                updateTarget(route)
            },
            {
                signal: disconnectController.signal
            }
        );
        
    }
};

export function addUpdateTarget(component)
{
    component.addEventListener(namings.events.connectComponent, 
        (e)=>
        {
            const route = e.target;
            route.addEventListener(namings.events.connectComponent, 
                connectToRoute,
                {
                    once: true
                });
        },
        {
            capture: true,
        });
};
