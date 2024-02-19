import * as namings from "/routing/namings.js"

console.log("router module");
export default class Router extends HTMLBodyElement
{
    constructor()
    {
        super();
        //connected component
        this.addEventListener(namings.connectingRoutingComponentEvent,
            (e)=>
            {
                console.log("routeur connectig route");
                let path = "/";
                const routesNode = e.composedPath()
                    .filter(node => node.localName == namings.routeComponent).reverse();
                let routesPath = routesNode.map( node => node.getAttribute(namings.attributePath));
                path = routesPath.join('/');
                if(!path.startsWith('/'))
                {
                    
                }
                console.log("dispatch event to target route : " + path);
                console.log(e);
                e.detail.src.dispatchEvent(
                    new CustomEvent(namings.connectedRoutingComponentEvent,
                        {
                            detail: 
                            {
                                path: path
                            }
                        }
                    )
                );
            }
        );
        //generate navigation event
        ///when popstate
        window.addEventListener("popstate",
            (e)=>
            {
                console.log("browser navigation");
                //this.navigate(document.location.pathname)
                this.updateRoutes();
                
            });
        ///when click anchor
        this.addEventListener(namings.navigateEvent,
            (e)=>
            {
                let newState = e.detail.state;
                let newLocation = new URL(location.origin);
                newLocation.pathname = e.detail.pathname;
                if(newLocation.pathname !== '/')
                {
                    newLocation.pathname += '/';
                }
                newLocation.hash = e.detail.hash;
                newLocation.search = e.detail.search;
                let newHref = newLocation.href;
                console.log(newHref);

                if(location.href != newHref)
                {
                    console.log("navigate")
                    history.pushState(newState,null,newHref);
                }
                else
                {
                    console.log("refresh")
                    //just reload
                    history.go()
                }
                this.updateRoutes();
            }
        );
    }

    connectedCallback()
    {
        console.log("routeur is connected");
        const shadow = this.attachShadow({mode: "open"});
        const baseRoute = document.createElement("alt-route");
        baseRoute.setAttribute(namings.attributePath, "");
        shadow.appendChild(baseRoute);
    }

    updateRoutes()
    {
        this.dispatchEvent(
            new CustomEvent(namings.routeChangeEvent,
                {
                    bubbles:true,
                    composed: true
                }
            )
        );
    }
}

