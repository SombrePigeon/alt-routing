export default 
{ 
    attributes:
    {
        path: "path",//toDo remove
        useShadow: "use-shadow",//toDo remove
        locationMatching: "match",//toDo remove
        locationMatchingValues://toDo move to enum
        {
            part: "part",
            exact: "exact",
            none: "none"
        },
    },
    enums:
    {
        locationMatch:
        {
            part: Symbol.for("part"),
            exact: Symbol.for("exact"),
            none: Symbol.for("none")
        },
        state: 
        {
            init: Symbol("init"),
            unloaded: Symbol.for("unloaded"),
            loaded: Symbol.for("loaded"),
            loading: Symbol.for("loading"),
            unloading: Symbol.for("unloading"),

        },
        status:
        {
            ok: Symbol.for("ok"),
            ko: Symbol.for("ko"),
            aborted: Symbol.for("aborted"),
        }

    },
    events:
    {
        navigate: "alt-navigate",
        navigated: "alt-navigated",
        routeChange: "alt-route-change",
        connectingRoutingComponent: "alt-new-routing",

        //routingconnecting
        connectComponent:"alt-connect",
        disconnectComponent:"alt-disconnect",
        //routing lifeCycle
        unloaded :"alt-unloaded",
        loaded :"alt-loaded",
        beforeLoading :"alt-beforeLoading",
        loading :"alt-loading",
        beforeUnloading :"alt-beforeUnloading",
        unloading :"alt-unloading",
        //abort request
        beforeAbort: "alt-beforeAbort",
        abort: "alt-abort",

    },
    components:
    {
        route: "alt-route",
        router: "alt-router",
        anchor: "alt-a",
    },
    files:
    {
        template: "template.html",
        nav: "nav.html",
        content: "content.html",
        route: "route.html",
        style: "style.css"
    }
}