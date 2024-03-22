import namings from "./namings.js";
import config from "./config.js";
console.log("route module");

export default class Route extends HTMLElement
{
    path;
    absolutePath;
    isRouteur = false;
    rendered = false;
    useShadow;
    shadow = null;

    static observedAttributes = [namings.attributes.machedRoute];

    attributeChangedCallback(name, oldValue, newValue)
    {
        if(oldValue !== newValue)
        {
            this.updateRouteState();
        }
    }

    connectionEventListener = (e) => 
    {
        //set absolute path
        console.log("route connected !");
        this.absolutePath = e.detail.path;
        this.routeur = e.detail.routeur;
        this.setMatching();
        this.loadTemplate();
        //listen to route change
        this.routeur.addEventListener(namings.events.routeChange,
            this.routeChangeEventListener);
    };

    routeChangeEventListener = (e) =>
    {
        this.setMatching();
    };

    popstateEventListener = (e)=>
    {
        console.log("browser navigation");
        this.updateRoutes();
    };

    navigateEventListener = (e)=>
    {
        let destinationURL = e.detail.url;
        let destinationState = e.detail.state;

        if(location.href !== destinationURL
            || history.state !== destinationState)
        {
            console.log("navigate")
            history.pushState(destinationState, null, destinationURL);
            this.updateRoutes();
        }
        else
        {
            console.log("refresh")
            //just reload
            history.go()
        }
    }

    constructor(path = null, useShadow = config.useShadow)
    {
        super();
        if(path != null)
        {
            this.path = path;
        }
        else
        {
            this.path = this.getAttribute(namings.attributes.path);
        }
        if(useShadow != null)
        {
            this.useShadow = useShadow;
        }
        else
        {
            this.useShadow = this.getAttribute(namings.attributes.useShadow) !== "false";
        }

        if(!this.path.endsWith('/'))
        {
            this.path += '/';
        }

        this.isRouteur = this.path.startsWith('/');

        if(this.isRouteur)
        {
            console.log("route is routeur");
            this.addEventListener(namings.events.connectingRoutingComponent,
                e => 
                {
                    e.detail.routeur = this;
                    e.detail.path = "";
                },
                {
                    passive: true,
                    capture: true
                }
            );
            //generate navigation event
            ///when popstate event
            window.addEventListener("popstate",
            this.popstateEventListener);
            ///when click internal navigation
            this.addEventListener(namings.events.navigate,
                this.navigateEventListener);
        }

        this.addEventListener(namings.events.connectingRoutingComponent,
            e => 
            {
                e.detail.path += this.path;
            },
            {
                passive: true,
                capture: true
            }
        );

        this.addEventListener(namings.events.connectingRoutingComponent,
            this.connectionEventListener,
            {
                passive: true,
                once: true
            }   
        )
    }

    connectedCallback()
    {
        console.log("route is connecting");
        this.dispatchEvent(
            new CustomEvent(namings.events.connectingRoutingComponent,
                {
                    composed: true,
                    detail: {}
                }
            )
        );
        
        
    }

    disconnectedCallback()
    {
        console.log("disconnect" + this.absolutePath);
        //disconnect window eventListenners
        if(this.isRouteur)
        {
            window.removeEventListener("popstate", this.popstateEventListener);
        }
        this.routeur.removeEventListener(namings.events.routeChange, this.routeChangeEventListener);
    }

    setMatching()
    {
        //match match-exact no
        let match = "no";
        if(location.pathname.startsWith(this.absolutePath))
        {
            if(location.pathname === this.absolutePath)
            {
                match = "match-exact";
            }
            else
            {
                match = "match";
            }
        }

        this.setAttribute(namings.attributes.machedRoute,match);
    }

    updateRouteState()
    {
        if(!this.rendered && document.location.pathname.startsWith(this.absolutePath))
        {
            this.loadRoute();
            this.rendered=true;
        }
        else if(this.rendered && !document.location.pathname.startsWith(this.absolutePath)) 
        {
            this.unloadRoute();
            this.rendered=false;
        }
    }

    async loadRoute()
    {
        const componentAbsolutePath = this.absolutePath + "content.html";
        console.log("path is " + componentAbsolutePath);
        await fetch(componentAbsolutePath)
            .then((response) =>
            {
                return response.text();
            })
            .then((html) =>
            {
                this.innerHTML = html;
            });
    
    }

    unloadRoute()
    {
        for (let child of this.childNodes)
        {
            this.removeChild(child);
        }
    }

    async loadTemplate()
    {
        if(this.useShadow)
        {
            if(this.shadow == null)
            {
                this.shadow = this.attachShadow({mode: "open"});
            }

            const componentAbsoluteTemplatePath = this.absolutePath + "template.html";
            console.log("path is " + componentAbsoluteTemplatePath)
            await fetch(componentAbsoluteTemplatePath)
                .then(response =>
                {
                    return response.text();
                })
                .then((html) =>
                {
                    this.shadow.innerHTML = html;
                }
            );
        }
    }

    updateRoutes()
    {
        this.dispatchEvent(
            new CustomEvent(namings.events.routeChange,
                {
                    bubbles:true,
                    composed: true
                }
            )
        );
    }
}

customElements.define(namings.components.route, Route);
