import namings from "./namings.js"
console.debug("anchor module");

export default class Anchor extends HTMLAnchorElement
{
    #routeur;
    #_locationMatch;
    //getters&setters
    get #locationMatch()
    {
        return this.#_locationMatch;
    }
    set #locationMatch(locationMatch) 
    {
        if(this.#_locationMatch !== locationMatch)
        {
            //this.#_locationMatch && this.#internals.states.delete(`${Symbol.keyFor(this.#_locationMatch)}`);
            this.#_locationMatch = locationMatch;
            //this.#_locationMatch && this.#internals.states.add(`${Symbol.keyFor(this.#_locationMatch)}`);
            this.dataset.locationMatch = Symbol.keyFor(this.#_locationMatch);
        }
    }

    constructor() 
    {
        super();
        this.#locationMatch = namings.enums.locationMatch.none;
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
        console.debug("anchor is connecting " );
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
        this.#routeur?.removeEventListener(namings.events.routeChange, this.routeChangeEventListener);
    }

    //methods
    initNavigationEvent()
    {
        if(!this.getAttribute(this.download))
        {
            this.addEventListener("click", 
            (e) => 
            {
                e.preventDefault();
                console.log("cancel natural navigation, go to : " + this.href + " or "+ this.getAttribute("href"));
                this.#routeur.dispatchEvent(
                    new CustomEvent(namings.events.navigate,
                    {
                        detail:
                        {
                            url: new URL(this.href),
                            target: this.target,
                            state: null,
                            rel: this.rel.split(',')
                                .filter(r => r === "noopener" || r === "noreferrer")
                                .join(',')
                        }
                    }
                    )
                );
            });
        }
        
    }

    updateLocationMatch()
    {
        let match = namings.enums.locationMatch.none;
        //toDo try opti
        if(location.href.startsWith(this.href))
        {
            if(location.href === this.href)
            {
                match = namings.enums.locationMatch.exact;
            }
            else
            {
                match = namings.enums.locationMatch.part;
            }
        }
        this.#locationMatch = match;
    }

    //eventsListeners
    connectionEventListener = (e) => 
    {
        //rewrite href(absolute) 
        let href = this.getAttribute("href");
        //debugger
        if(e.detail.url)
        {
            this.href = new URL(href, e.detail.url);
        }
        this.#routeur = e.detail.routeur;
        //set for first time
        this.updateLocationMatch();
        //listen to route change
        this.#routeur?.addEventListener(namings.events.routeChange,
            this.routeChangeEventListener);
        this.initNavigationEvent();
        console.debug(`anchor "${this.href}" is connected `);
    };

    routeChangeEventListener = (e) =>
    {
        this.updateLocationMatch();
    };
}

customElements.define(namings.components.anchor, Anchor, { extends: "a" });
