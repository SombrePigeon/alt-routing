import * as namings from "./namings.js"
console.log("route module");

export default class Route extends HTMLElement
{
    path;
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
        this.path = e.detail.path;
        if(!this.path.endsWith('/'))
        {
            this.path += '/';
        }
        this.setMatching();
        //listen to route change
        this.eventListener = window.addEventListener(namings.routeChangeEvent,
            this.routeChangeEventListener);
        //disconnect this event
        this.removeEventListener(namings.connectedRoutingComponentEvent, this.connectionEventListener);
    }

    routeChangeEventListener = e =>
    {
        this.setMatching();
    };

    constructor()
    {
        super();
        this.addEventListener(namings.connectedRoutingComponentEvent, 
            this.connectionEventListener);
    }

    connectedCallback()
    {
        
        this.useShadow = !this.getAttributeNode(namings.attributeUseShadow);
        this.path = this.getAttribute(namings.attributePath);
        console.log("route is connecting");
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

    disconnectedCallback()
    {
        console.log("disconnect" + this.path);
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

}
