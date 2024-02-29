import * as namings from "./namings.js"
console.log("anchor module");

export default class Anchor extends HTMLAnchorElement
{
    appNavigation=false;
    connectionEventListener = (e) => 
    {
        //set new href(absolute) 
        let href = this.getAttribute("href");
        this.href = location.origin;
        this.pathname = e.detail.path + '/';
        this.href += href;
        if(!this.pathname.endsWith('/'))
        {
            this.pathname += '/';
        }
        console.log("anchor is connected ");
        this.initNavigationEvent();
        this.removeEventListener(namings.connectedRoutingComponentEvent, this.connectionEventListener);
    };

    constructor() 
    {
        super();
        //when initialisez :
        this.appNavigation = this.origin == location.origin
        && !this.getAttribute("href").startsWith('/');
        if(!this.appNavigation)
        {
            this.initNavigationEvent();
        }
        else
        {
            this.addEventListener(namings.connectedRoutingComponentEvent, 
                this.connectionEventListener);
        }
    }

    connectedCallback()
    {
        if(this.appNavigation)
        {
            console.log("anchor is connecting " );
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
    }

    initNavigationEvent()
    {
        this.addEventListener("click", 
        (e) => 
        {
            e.preventDefault();
            console.log("cancel natural navigation, go to : " + this.href + " or "+ this.getAttribute("href"));
            this.dispatchEvent(
                new CustomEvent(namings.navigateEvent,
                    {
                        bubbles:true,
                        composed: true,
                        detail:
                        {
                            pathname: this.pathname,
                            search: this.search,
                            hash: this.hash,
                            state: null
                        }
                    }
                )
            );
        });
    }
}
