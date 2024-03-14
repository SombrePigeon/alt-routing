import namings from "./namings.js"
console.log("form module");

export default class Form extends HTMLFormElement
{
    appNavigation=false;
    location;
    connectionEventListener = (e) => 
    {
        const path = this.location.pathname;
        this.location.pathname = e.detail.path;
        if(!location.pathname.endsWith('/'))
        {
            location.pathname += '/';
        }
        this.action = this.location.href;
        console.log("form is connected : " + this.location);
        this.initNavigationEvent();
    };

    constructor() 
    {
        super();
        //when initialisez :
        this.location = new URL(this.action);
        debugger
        this.appNavigation = this.location.origin == location.origin
        if(!this.appNavigation)
        {
            this.initNavigationEvent();
        }
        else
        {
            this.addEventListener(namings.events.connectingRoutingComponent, 
                this.connectionEventListener,
                {
                    passive: true,
                    once: true
                });
        }
    }

    connectedCallback()
    {
        if(this.appNavigation)
        {
            console.log("form is connecting " );
            this.dispatchEvent(
                new CustomEvent(namings.events.connectingRoutingComponent,
                    {
                        composed: true,
                        detail: {}
                    }
                )
            );
        }
    }

    initNavigationEvent()
    {
        this.addEventListener("submit", 
        (e) => 
        {
            e.preventDefault();
            console.log("cancel natural form navigation, go to : " + this.action + " or "+ this.getAttribute("href"));
            let searchParam = Array.from(this.elements)
                .filter(e => e.name)
                .map(e =>
                    {
                        return `${e.name}=${e.value}`
                    })
                .join("&");
            debugger
            this.dispatchEvent(
                new CustomEvent(namings.events.navigate,
                    {
                        bubbles:true,
                        composed: true,
                        detail:
                        {
                            pathname: this.location.pathname,
                            search: searchParam,
                            hash: this.location.hash,
                            state: null
                        }
                    }
                )
            );
        });
    }
}

customElements.define(namings.components.form, Form, { extends: "form" });
