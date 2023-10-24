import { getDirectRoutesElements } from "/routing/functions.js";
import * as namings from "/routing/namings.js"

console.log("router");
export default class Router extends HTMLBodyElement
{
    constructor()
    {
        super();
        const shadow = this.attachShadow({mode: "open"});
        const baseRoute = document.createElement("alt-route");
        baseRoute.setAttribute(namings.attributePath, "/");
        shadow.appendChild(baseRoute);
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

