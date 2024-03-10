import * as namings from "./namings.js"

console.log("router module");
export default class Router extends HTMLBodyElement
{
    constructor()
    {
        super();
        
    }

    connectedCallback()
    {
        console.log("routeur is connected");
        //const shadow = this.attachShadow({mode: "open"});
        const baseRoute = document.createElement("alt-route");
        baseRoute.setAttribute(namings.attributePath, "/");
        this.appendChild(baseRoute);
    }

    
}

