import namings from "./namings.js"
console.log("anchor module");

export default class Anchor extends HTMLAnchorElement
{
    appNavigation=false;
    connectionEventListener = (e) => 
    {
        //rewrite href(absolute) 
        let href = this.getAttribute("href");
        this.href = location.origin;
        this.pathname = e.detail.path;
        this.href += href;
        if(!this.pathname.endsWith('/'))
        {
            this.pathname += '/';
        }
        console.log("anchor is connected ");
        this.initNavigationEvent();
    };

    constructor() 
    {
        super();
        //when initialisez :
        this.appNavigation = this.origin == location.origin
        && !this.getAttribute("href").startsWith('/');//toDo remove if necessary
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
            console.log("anchor is connecting " );
            this.dispatchEvent(
                new CustomEvent(namings.events.connectingRoutingComponent,
                    {
                        composed: true,
                        detail:
                        {
                            src: this
                        }
                    }
                )
            );
        }
    }

    initNavigationEvent()
    {
        this.addEventListener("click", 
        (e) => 
        {
            e.preventDefault();
            console.log("cancel natural navigation, go to : " + this.href + " or "+ this.getAttribute("href"));
            this.dispatchEvent(
                new CustomEvent(namings.events.navigate,
                    {
                        bubbles:true,
                        composed: true,
                        detail:
                        {
                            pathname: this.pathname,
                            search: this.search,
                            hash: this.hash,
                            state: null
                        }
                    }
                )
            );
        });
    }
}

customElements.define(namings.components.anchor, Anchor, { extends: "a" });
