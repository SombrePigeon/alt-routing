export default 
{
    enums:
    {
        locationMatch:
        {
            part: "part",
            exact: "exact",
            none: "none"
        },
        locationMatchType:
        {
            fresh: "fresh",
            still: "still",
            hidden: "hidden"
        },
        state: 
        {
            init: "init",
            unloaded: "unloaded",
            loaded: "loaded",
            loading: "loading",
            unloading: "unloading",

        }

    },
    events:
    {
        navigate: "alt-navigate",
        navigated: "alt-navigated",
        routeChange: "alt-route-change",
        
        connectComponent: "alt-new-routing",
        disconnectComponent: "alt-delete-routing",

        //routing lifeCycle
        unloaded: "alt-unloaded",
        loaded: "alt-loaded",
        loading: "alt-loading",
        unloading: "alt-unloading",
        //routing infos
        navLoaded: "alt-nav-loaded",
        routingLoaded: "alt-route-loaded",
        //abort request
        abort: "alt-abort",

    },
    components:
    {
        route: "alt-route",
        router: "alt-router",
        anchor: "alt-a",
        title: "alt-title",
        slot: "alt-slot"
    },
    files:
    {
        template: "template.html",
        nav: "nav.html",
        content: "content.html",
        routing: "routing.html",
        title: "title.html",
        style: "style.css"
    },
    classes:
    {
        altTarget: "alt-target"
    }
}