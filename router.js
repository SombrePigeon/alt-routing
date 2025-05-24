import namings from "./namings.js";
import Route from "./route.js";//required
import {addShadowToConnectingRoutes} from "./features/shadow.js";
import {addStyleToConnectingRoutes} from "./features/style.js"
import {addUpdateTarget} from "./features/target.js";
import config from "alt-routing/config";

console.info("alt-routing module init : router");

export default class Router extends HTMLElement
{
    connectedCallback()
    {
        if(config.routeur.features.shadowRouting)
        {
            addShadowToConnectingRoutes(this);
            if(config.routeur.features.styleShadowRouting)
            {
                addStyleToConnectingRoutes(this);
            }
        }
        if(config.routeur.features.updateTarget)
        {
            addUpdateTarget(this);
        }
        this.innerHTML = 
        `
            <${namings.components.route} data-path="/">
            </${namings.components.route}>
        `;
    }
}

customElements.define(namings.components.router, Router, { extends: "main" });
