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
        if(!this.absolutePath.endsWith('/'))
        {
            this.absolutePath += '/';
        }
        this.setMatching();
        //listen to route change
        this.eventListener = window.addEventListener(namings.routeChangeEvent,
            this.routeChangeEventListener);
        //disconnect this event
        this.removeEventListener(namings.connectedRoutingComponentEvent, this.connectionEventListener);
    };

    routeChangeEventListener = e =>
    {
        this.setMatching();
    };

    connectingRoutingComponentEventListener = (e)=>
    {
        console.log("routeur connecting route");
        let path = this.path;
        const routesNode = e.composedPath()
            .filter(node => node.localName == namings.routeComponent).reverse();
        let routesPath = routesNode.map( node => node.getAttribute(namings.attributePath));
        path = routesPath.join('/');
        console.log("dispatch event to target route : " + path);
        console.log(e);
        e.detail.src.dispatchEvent(
            new CustomEvent(namings.connectedRoutingComponentEvent,
                {
                    detail: 
                    {
                        path: path
                    }
                }
            )
        );
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
        console.log(newHref);

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

    constructor()
    {
        super();
    }

    connectedCallback()
    {
        this.useShadow = !this.getAttributeNode(namings.attributeUseShadow);
        this.path = this.getAttribute(namings.attributePath);
        this.isRouteur = this.path.startsWith('/');
        console.log("route is connecting");
        if(!this.isRouteur)
        {
            this.addEventListener(namings.connectedRoutingComponentEvent, 
                this.connectionEventListener);
            this.dispatchEvent(
                new CustomEvent(namings.connectingRoutingComponentEvent,
                    {
                        bubbles:true,
                        composed: true,
                        detail:
                        {
                            src: this
                        }
                    }
                )
            );
        }
        else
        {
            console.log("route is routeur");
            this.addEventListener(namings.connectingRoutingComponentEvent,
                this.connectingRoutingComponentEventListener);
            //generate navigation event
            ///when popstate event
            window.addEventListener("popstate",
            this.popstateEventListener);
            ///when click internal navigation
            this.addEventListener(namings.navigateEvent,
                this.navigateEventListener);
        }
        
    }

    disconnectedCallback()
    {
        console.log("disconnect" + this.path);
        //disconnect eventListenner
        if(this.eventListener)
        {
            //toDo listen to routeur route instead
            window.removeEventListener(namings.routeChangeEvent,this.eventListener);
        }
    }

    setMatching()
    {
        //match match-exact no
        let match = "no";
        if(location.pathname.startsWith(this.path))
        {
            if(location.pathname === this.path)
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
        if(!this.rendered && document.location.pathname.startsWith(this.path))
        {
            this.loadRoute();
            this.loadTemplate();
            this.rendered=true;
        }
        else if(this.rendered && !document.location.pathname.startsWith(this.path)) 
        {
            this.unloadRoute();
            this.unloadTemplate();
            this.rendered=false;
        }
    }

    async loadRoute()
    {
        let componentAbsolutePath = "/content.html";
        if(this.path != "/")
        {
            componentAbsolutePath = this.path + "content.html";
        }
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
            let componentAbsoluteTemplatePath = "/template.html";
            if(this.path != "/")
            {
                componentAbsoluteTemplatePath = this.path + "template.html";
            }
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
