import { getDirectRoutesElements } from "/routing/functions.js";
import * as namings from "/routing/namings.js"
console.log("route");

//toDo
//rework to react to event and propagate to subroutes and load if match only v0
//navigate event 


export default class Route extends HTMLElement
{
    path;
    consumedPath = "";
    consumablePath = "";

    constructor()
    {
        super();
        const shadow = this.attachShadow({mode: "open"});
        const child = document.createElement("slot");
        shadow.appendChild(child);
        
    }

    connectedCallback()
    {
        this.path = this.getAttribute(namings.attributePath);
        console.log("new route connected : " + this.getAttribute(namings.attributePath));
        //send event to notify parent routes
        this.dispatchEvent(
            new CustomEvent(namings.newRouteEvent,
                {
                    bubbles:true,
                    composed: true
                }
            )
        );
        //catch new child route element added
        this.addEventListener(namings.newRouteEvent,
            (e)=>{
                console.log("route " + this.getAttribute(namings.attributePath) + " catch event from route " + e.target.getAttribute(namings.attributePath))
                this.propagate()
            }      
        );

        
    }

    disconnectedCallback()
    {
        console.log("disconect" + path)
        //send disconnect event ?
    }


    static observedAttributes = [namings.attributeConsumablePath];

    attributeChangedCallback(name, oldValue, newValue)
    {
        if(name == namings.attributeConsumablePath
            && oldValue != newValue)
        {
            this.consumablePath = this.getAttribute(namings.attributeConsumablePath);
            if(newValue.startsWith(this.path))
            {
                console.log("match");
                this.loadRoute().then(
                    ()=>
                    {
                        console.log("subnavigate from : " + this.consumedPath);
                        console.log("subnavigate to : " + this.path);
                        console.log("subnavigate can match : " + this.consumablePath);
                        this.propagate();
                    }
                );
            }
            else
            {
                console.log("unmatch");
                this.unloadRoute();
            }
        }
    }


    propagate()
    {
        const directRoutes = Array.from(getDirectRoutesElements(this));
        for(let route of directRoutes)
        {
            route.setAttribute(namings.attributeConsumedPath, this.consumedPath + "/" + this.path);
            route.setAttribute(namings.attributeConsumablePath, this.consumablePath.substring(this.path.length + 1));
        }
    }


    async loadRoute()
    {
        const componentAbsolutePath = this.getAttribute(namings.attributeConsumedPath)
            + "/"
            + this.getAttribute(namings.attributePath);

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
        this.innerHTML="";
    }

}
