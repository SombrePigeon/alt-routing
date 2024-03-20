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
        const formdata = new FormData(this);
        const detail =
        {
            pathname: this.location.pathname,
            search: null,
            hash: this.location.hash,
            state: null
        };
        switch(this.method)
        {
            case "get":
                this.addEventListener("submit",
                (e) =>
                {
                    e.preventDefault();
                    const formData = new FormData(this);
                    const search = new URLSearchParams(formData);
                    this.dispatchEvent(
                        new CustomEvent(namings.events.navigate,
                            {
                                bubbles:true,
                                composed: true,
                                detail: 
                                {
                                    ...detail,
                                    search: search
                                }
                            }
                        )
                    );
                });
                break;
            case "post":
                this.addEventListener("submit",
                (e) =>
                {
                    e.preventDefault();
                    const formData = new FormData(this);
                    fetch(this.action, {
                        method: "POST",
                        body: formData
                    })
                    .then(response => {
                        if (response.redirected) {
                            this.dispatchEvent(
                                new CustomEvent(namings.events.navigate,
                                    {
                                        bubbles:true,
                                        composed: true,
                                        detail: 
                                        {
                                            ...detail,
                                            pathname: response.url
                                        }
                                    }
                                )
                            );
                        }
                        else
                        {
                            //replace target with response body
                        }
                    })
                    .catch(error => {
                        console.error('Une erreur s\'est produite:', error);
                    });
                    
                });
                break;
            default:
                console.error(`unhandled method "${this.method}"`);
        }
    }
}

customElements.define(namings.components.form, Form, { extends: "form" });
