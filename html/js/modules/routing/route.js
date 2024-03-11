import * as namings from "./namings.js"
console.log("route module");

export default class Route extends HTMLElement
{
    path;
    absolutePath;
    isRouteur = false;
    rendered = false;
    useShadow;
    shadow = null;

    static observedAttributes = [namings.attributeMachedRoute];

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
        this.setMatching();
        //listen to route change
        window.addEventListener(namings.routeChangeEvent,
            this.routeChangeEventListener);
    };



    routeChangeEventListener = (e) =>
    {
        this.setMatching();
    };

    popstateEventListener = (e)=>
    {
        console.log("browser navigation");
        //this.navigate(document.location.pathname)
        this.updateRoutes();
    };

    navigateEventListener = (e)=>
    {
        let newState = e.detail.state;
        let newLocation = new URL(location.origin);
        newLocation.pathname = e.detail.pathname;
        newLocation.hash = e.detail.hash;
        newLocation.search = e.detail.search;
        let newHref = newLocation.href;

        if(location.href !== newHref)
        {
            console.log("navigate")
            history.pushState(newState,null,newHref);
        }
        else
        {
            console.log("refresh")
            //just reload
            history.go()
        }
        this.updateRoutes();
    }

    constructor(path = null, useShadow = null)
    {
        super();
        if(path != null)
        {
            this.path = path;
        }
        else
        {
            this.path = this.getAttribute(namings.attributePath);
        }
        if(useShadow != null)
        {
            this.useShadow = useShadow;
        }
        else
        {
            this.useShadow = this.getAttribute(namings.attributeUseShadow) !== "false";
        }

        if(!this.path.endsWith('/'))
        {
            this.path += '/';
        }

        this.isRouteur = this.path.startsWith('/');

        if(this.isRouteur)
        {
            console.log("route is routeur");
            this.addEventListener(namings.connectingRoutingComponentEvent,
                e => 
                {
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
            this.addEventListener(namings.navigateEvent,
                this.navigateEventListener);

            
        }
        this.addEventListener(namings.connectingRoutingComponentEvent,
            e => 
            {
                e.detail.path += this.path;
            },
            {
                passive: true,
                capture: true
            }
        );
        this.addEventListener(namings.connectingRoutingComponentEvent,
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
        this.addEventListener(namings.connectedRoutingComponentEvent, 
            this.connectionEventListener);
        this.dispatchEvent(
            new CustomEvent(namings.connectingRoutingComponentEvent,
                {
                    //bubbles:true,
                    composed: true,
                    detail:
                    {
                        src: this
                    }
                }
            )
        );
        
        
    }

    disconnectedCallback()
    {
        console.log("disconnect" + this.absolutePath);
        //disconnect eventListenner
        if(this.eventListener)
        {
            window.removeEventListener(namings.routeChangeEvent,this.eventListener);
        }
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

        this.setAttribute(namings.attributeMachedRoute,match);
    }

    updateRouteState()
    {
        if(!this.rendered && document.location.pathname.startsWith(this.absolutePath))
        {
            this.loadRoute();
            this.loadTemplate();
            this.rendered=true;
        }
        else if(this.rendered && !document.location.pathname.startsWith(this.absolutePath)) 
        {
            this.unloadRoute();
            this.unloadTemplate();
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
        this.innerHTML="";//meh moryleak ?
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

    unloadTemplate()
    {
        if(this.useShadow && this.shadow != null)
        {
            this.shadow.innerHTML="";//meh moryleak ?
        }
        
    }

    updateRoutes()
    {
        this.dispatchEvent(
            new CustomEvent(namings.routeChangeEvent,
                {
                    bubbles:true,
                    composed: true
                }
            )
        );
    }
}

customElements.define(namings.routeComponent, Route);
