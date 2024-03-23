import namings from "./namings.js"
console.log("anchor module");

export default class Anchor extends HTMLAnchorElement
{
    routeur;
    connectionEventListener = (e) => 
    {
        //rewrite href(absolute) 
        let href = this.getAttribute("href");
        this.href = new URL(href, e.detail.url);
        this.routeur = e.detail.routeur;
        console.log("anchor is connected ");
        this.initNavigationEvent();
    };

    constructor() 
    {
        super();
        //init callback
        this.addEventListener(namings.events.connectingRoutingComponent, 
            this.connectionEventListener,
            {
                once: true
            });
    }

    connectedCallback()
    {
        console.log("anchor is connecting " );
        this.dispatchEvent(
            new CustomEvent(namings.events.connectingRoutingComponent,
                {
                    composed: true,
                    detail: {}//needed 
                }
            )
        );
    }

    initNavigationEvent()
    {
        this.addEventListener("click", 
        (e) => 
        {
            e.preventDefault();
            console.log("cancel natural navigation, go to : " + this.href + " or "+ this.getAttribute("href"));
            this.routeur.dispatchEvent(
                new CustomEvent(namings.events.navigate,
                {
                    detail:
                    {
                        url: new URL(this.href),
                        state: null
                    }
                }
                )
            );
        });
    }
}

customElements.define(namings.components.anchor, Anchor, { extends: "a" });
