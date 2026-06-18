import namings from "./namings.json" with { type: "json" };
import config from "alt-routing/config.json" with { type: "json" };

console.info("alt-routing module init : anchor");

export default class Anchor extends HTMLAnchorElement
{
    #_locationMatch;
    #removeListenersController;

    get #locationMatch()
    {
        return this.#_locationMatch;
    }
    set #locationMatch(locationMatch) 
    {
        const lm = namings.enums.locationMatch;
        let openBefore = this.#_locationMatch != lm.none ? namings.enums.states.open : null;
        let currentBefore = this.#_locationMatch == lm.exact ? namings.enums.states.current : null;
        this.#_locationMatch = locationMatch;
        let openAfter = this.#_locationMatch != lm.none ? namings.enums.states.open : null;
        let currentAfter = this.#_locationMatch == lm.exact ? namings.enums.states.current : null;
        this.#replaceState(openBefore, openAfter);
        this.#replaceState(currentBefore, currentAfter);
    }

    get locationMatch()
    {
        return this.#_locationMatch;
    }

    connectedCallback()
    {
        this.addEventListener(namings.events.connectComponent, 
            this.#connectionEventListener,
            {
                once: true
            });
        this.dispatchEvent(
            new CustomEvent(namings.events.connectComponent,
                {
                    composed: true,
                    detail: {}//must be initialized
                }
            )
        );
    }

    disconnectedCallback()
    {
        this.#removeListenersController.abort();
    }


    #updateLocationMatch = (navigateEvent) => 
    {
        const href = navigateEvent?.destination.url ?? location.href;
        let match = namings.enums.locationMatch.none;
        //toDo try opti
        if(href.startsWith(this.href))
        {
            if(href === this.href)
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

    #connectionEventListener = (e) => 
    {
        if(e.detail.url)
        {
            //rewrite href(absolute)
            const href = this.getAttribute("href");
            this.href = new URL(href, e.detail.url).href;
        }
        this.#removeListenersController = new AbortController();

        if(config.anchor.dataAttribute.state)
        {
            this.#updateLocationMatch();
            //toDo integration au view transitions/intercept
            navigation?.addEventListener("navigate",
                (navigateEvent)=>
                {
                    this.#updateLocationMatch(navigateEvent);
                },
                {
                    signal: this.#removeListenersController.signal
                }
            );
        }
    };

    #replaceState(from, to)
    {
        const state = this.dataset.state;
        const stateList = state?.split(/\s+/);
        const stateSet = new Set(stateList);
        if(from)
        {
            stateSet.delete(from);
        }
        if(to)
        {
            stateSet.add(to);
        } 
        this.dataset.state = [...stateSet].join(" ");
    }

}

customElements.define(namings.components.anchor, Anchor, { extends: "a" });
