import namings from "./namings.js"
import Route from "./route.js";
import {addShadowToConnectingRoutes} from "./route/shadow.js";
import {addStyleToConnectingRoutes} from "./route/style.js"
console.log("router module");;

export default class Router extends HTMLElement
{
    constructor()
    {
        super();
    }

    connectedCallback()
    {
        console.log("routeur is connected");
        if(this.dataset.shadow === "true")
        {
            addShadowToConnectingRoutes(this);
            if(this.dataset.style === "true")
            {
                addStyleToConnectingRoutes(this)
            }

        }
        this.innerHTML = `
                <${namings.components.route} data-path="/">
                </${namings.components.route}>
            `;
        
        
    }
}

customElements.define(namings.components.router, Router, { extends: "main" });
