import * as namings from "./namings.js"
import Route from "./route.js";
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
        this.appendChild(new Route('/'));
    }
}

customElements.define(namings.routerComponent, Router, { extends: "body" });
