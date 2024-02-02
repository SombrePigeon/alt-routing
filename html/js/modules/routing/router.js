import { getDirectRoutesElements } from "/routing/functions.js";
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
                let path = "";
                const routesNode = e.composedPath()
                    .filter(node => node.localName == namings.routeComponent).reverse();
                let routesPath = routesNode.map( node => node.getAttribute(namings.attributePath));
                for(const x of routesPath)
                {
                    path += (x + "/");
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
                let path = e.detail.href;
                this.navigate(path);
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

    navigate(path)
    {
        console.log("navigate to : " + path);
        history.pushState(null,null,path);
        //toDo emit routechage event
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

