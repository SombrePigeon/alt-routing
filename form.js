import namings from "./namings.js";
import config from "alt-routing/config";

console.info("alt-routing module init : form");

export default class Form extends HTMLFormElement
{
    #router;
    #_locationMatch;
    #base;

    get #locationMatch()
    {
        return this.#_locationMatch;
    }
    set #locationMatch(locationMatch) 
    {
        if(this.#_locationMatch !== locationMatch)
        {
            this.#_locationMatch = locationMatch;
            this.dataset.locationMatch = this.#_locationMatch;
        }
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
        this.#router?.removeEventListener(namings.events.routeChange, this.routeChangeEventListener);
    }

    #initNavigationEvent()
    {
        this.addEventListener("submit", 
            (e) => 
            {
                const method = e.submitter.formmethod ?? this.method;
                if(method !== "dialog")
                {
                    if(this.reportValidity())
                    {
                        e.preventDefault();

                        const action = e.submitter.formaction ?? this.action;
                        const target = e.submitter.formtarget ?? this.target;
                        const enctype = e.submitter.formenctype ?? this.enctype;
                        
                        const detail = {
                                            method: method,
                                            target: target,
                                            state: null,
                                            rel: this.rel.split(',')
                                                .filter(r => r === "noopener" || r === "noreferrer")
                                                .join(',')
                                        };

                        detail.url = new URL(action, this.#base);
                        
                        const formData = new FormData(this, e.submitter);
                    
                        if(enctype === "application/x-www-form-urlencoded")
                        {
                            detail.url.search = new URLSearchParams(formData);
                            detail.headers = { "Content-Type" : "application/x-www-form-urlencoded"};//toDo test if usefull
                        }
                        else if(enctype === "multipart/form-data")
                        {
                            detail.formData = formData;
                        }
                        else
                        {
                            //throw error
                        }


                        this.#router.dispatchEvent(
                            new CustomEvent(namings.events.navigate,
                                {
                                    detail: detail
                                }
                            )
                        );
                    }
                }
            });
    }

    #updateLocationMatch = () => 
    {
        let match = namings.enums.locationMatch.none;
        //toDo try opti
        if(location.href.startsWith(this.action))
        {
            if(location.href === this.action)
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
            this.#base = e.detail.url
        }
        
        this.#router = e.detail.router;
        if(config.form.showAttribute.locationMatch)
        {
            this.#updateLocationMatch();
            this.#router?.addEventListener(namings.events.routeChange,
                this.#updateLocationMatch);
        }
        this.#initNavigationEvent();
    };

}

customElements.define(namings.components.form, Form, { extends: "form" });
