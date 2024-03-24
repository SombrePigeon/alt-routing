import namings from "./namings.js"
console.log("anchor module");

export default class Anchor extends HTMLAnchorElement
{
    routeur;
    //getters&setters
    get locationMatch()
    {
        return this.getAttribute(namings.attributes.locationMatching);
    }
    set locationMatch(value)
    {
        this.setAttribute(namings.attributes.locationMatching, value);
    }

    constructor() 
    {
        super();
        this.locationMatch = namings.attributes.locationMatchingValues.none;
        //init callback
        this.addEventListener(namings.events.connectingRoutingComponent, 
            this.connectionEventListener,
            {
                once: true
            });
    }

    //callbacks
    connectedCallback()
    {
        console.log("anchor is connecting " );
        this.dispatchEvent(
            new CustomEvent(namings.events.connectingRoutingComponent,
                {
                    composed: true,
                    detail: {}//must be initialized
                }
            )
        );
    }

    disconnectedCallback()
    {
        this.routeur.removeEventListener(namings.events.routeChange, this.routeChangeEventListener);
    }

    //methods
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
                        target: this.target,
                        state: null
                    }
                }
                )
            );
        });
    }

    setMatching()
    {
        const locationMatchingValues = namings.attributes.locationMatchingValues;
        let match = locationMatchingValues.none;
        if(location.pathname.startsWith(this.pathname))//refait ça stp ! signé toi de hier
        {
            if(location.pathname === this.pathname)// ça aussi
            {
                match = locationMatchingValues.exact;
            }
            else
            {
                match = locationMatchingValues.part;
            }
        }

        this.locationMatch = match;
    }

    //eventsListeners
    connectionEventListener = (e) => 
    {
        //rewrite href(absolute) 
        let href = this.getAttribute("href");
        this.href = new URL(href, e.detail.url);
        this.routeur = e.detail.routeur;
        //set for first time
        this.setMatching();
        //listen to route change
        this.routeur.addEventListener(namings.events.routeChange,
            this.routeChangeEventListener);
        this.initNavigationEvent();
        console.log("anchor is connected ");
    };

    routeChangeEventListener = (e) =>
    {
        this.setMatching();
    };
}

customElements.define(namings.components.anchor, Anchor, { extends: "a" });
