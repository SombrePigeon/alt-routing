import { getDirectRoutesElements } from "/routing/functions.js";
import * as namings from "/routing/namings.js"

console.log("router");

export default class Router extends HTMLBodyElement
{
    constructor()
    {
        super();
        const shadow = this.attachShadow({mode: "open"});
        const slot = document.createElement("slot");
        shadow.appendChild(slot);


        window.addEventListener("popstate",
        (e)=>{
            this.navigate(document.location.pathname)
        });
        this.addEventListener(namings.navigateEvent,
            (e)=>
            {
                console.log("custom navigation");
                const routesNode = e.composedPath().filter(node => node.localName == namings.routeComponent).reverse();
                const routesPath = routesNode.map( node => node.getAttribute(namings.attributePath));
                const routesPathTarget = [...routesPath,e.target.getAttribute("href")]
                let path = routesPathTarget.reduce(
                    (a,b)=>
                        {
                            return a + "/" + b;
                        },
                        ""
                    );
                    //toDo : check with fragment url ans querries and absulute path
                    history.pushState({},null, path);
                    this.navigate(path);
            });
    }


    connectedCallback()
    {
        console.log("routeur is connected");
        let directRoutes = getDirectRoutesElements(this);
        console.log(directRoutes);
        //toDo send event routechange event
    }

    navigate(path)
    {
        console.log("navigate to : " + path);
        path = path.substring(1);
        const directRoutes = Array.from(getDirectRoutesElements(this));
        for(let route of directRoutes)
        {
            route.setAttribute(namings.attributeConsumedPath, "");
            route.setAttribute(namings.attributeConsumablePath, path);
        }
    }
}

