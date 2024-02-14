import { getDirectRoutesElements } from "/routing/functions.js";
import * as namings from "/routing/namings.js"
console.log("route module");

//toDo
//rework to react to event and propagate to subroutes and load if match only v0
//navigate event 


export default class Route extends HTMLElement
{
    path;
    rendered = false;
    shadow;
    routeChangeEventListener = e =>
    {
        this.updateRouteState();
    };

    constructor()
    {
        super();
        //loading default shadow
        this.shadow = this.attachShadow({mode: "open"});
        const child = document.createElement("slot");
        //shadow.appendChild(child);
        this.addEventListener(namings.connectedRoutingComponentEvent, 
            (e) => 
            {
                //set absolute path
                console.log("route connected !");
                this.path = e.detail.path;
                //remove last / if not just /
                if(this.path != "/" && this.path.endsWith("/"))
                {
                    this.path = this.path.substring(0,this.path.length - 1);
                }
                this.updateRouteState();
                //listen to route change
                this.eventListener = window.addEventListener(namings.routeChangeEvent,
                    this.routeChangeEventListener);
                //disconnect this event
                this.removeEventListener(namings.routeChangeEvent, this.routeChangeEventListener);
            });
    }

    connectedCallback()
    {
        this.path = this.getAttribute(namings.attributePath);
        console.log("route is connecting")
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
        //if baseroute
        /*if(this.path === "/")
        {
            window.addEventListener("popstate",
            (e)=>
            {
                this.navigate(document.location.pathname)
            });
            //react to navigation
            this.addEventListener(namings.navigateEvent,
                (e)=>
                {
                    let path = "";
                    console.log("custom navigation");
                    const routesNode = e.composedPath()
                        .filter(node => node.localName == namings.routeComponent).reverse();
                    let routesPath = routesNode.map( node => node.getAttribute(namings.attributePath));
                    routesPath.filter(route => route != "/")
                    for(const x of routesPath)
                    {
                        path += (x + "/");
                    }
                    path += e.target.getAttribute("href");
                    
                    
                    //toDo : check with fragment url ans querries and absulute path
                    console.log(" to path : " + path);
                    history.pushState({},null, path);
                    this.propagate();
                }
            );
            this.setAttribute(namings.attributeConsumablePath, document.location.pathname);
        }
        else
        {
            //send event to notify parent routes
            this.dispatchEvent(
                new CustomEvent(namings.newRouteEvent,
                    {
                        bubbles:true,
                        composed: true
                    }
                )
            );
        }
        //catch new child route element added
        this.addEventListener(namings.newRouteEvent,
            (e)=>{
                console.log("route " + this.getAttribute(namings.attributePath) + " catch event from route " + e.target.getAttribute(namings.attributePath))
                this.propagate()
            }      
        );

        */
    }

    disconnectedCallback()
    {
        console.log("disconnect" + this.path)
        //disconnect eventListenner
        if(this.eventListener)
        {
            window.removeEventListener(namings.routeChangeEvent,this.eventListener);
        }
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
            componentAbsolutePath = this.path + "/" + "content.html";
        }
        console.log("path is " + componentAbsolutePath)
        await fetch(componentAbsolutePath).then((response) =>
             {
                return response.text();
             }).then((html) =>
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
        let componentAbsoluteTemplatePath = "/template.html";
        if(this.path != "/")
        {
            componentAbsoluteTemplatePath = this.path + "/" + "template.html";
        }
        console.log("path is " + componentAbsoluteTemplatePath)
        await fetch(componentAbsoluteTemplatePath).then((response) =>
             {
                return response.text();
             }).then((html) =>
             {
                this.shadow.innerHTML = html;
             });
        
    }

    unloadTemplate()
    {
        this.shadow.innerHTML="";
    }

}
