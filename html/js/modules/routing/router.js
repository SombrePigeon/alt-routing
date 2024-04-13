import namings from "./namings.js"
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
        this.innerHTML = `
        <${namings.components.route} data-path="/">
        </${namings.components.route}>
        `;
    }
}

customElements.define(namings.components.router, Router, { extends: "body" });
