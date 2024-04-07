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
    enum:
    {
        state: 
        {
            unloaded: Symbol.for("unloaded"),
            loaded: Symbol.for("loaded"),
            loading: Symbol.for("loading"),
            unloading: Symbol.for("unloading"),
        },
        reason:
        {
            ok: "",//?
            ko: "",
            cancelled: ""
        }

    },
    events:
    {
        navigate: "alt-navigate",
        navigated: "alt-navigated",
        routeChange: "alt-route-change",
        connectingRoutingComponent: "alt-new-routing",
    },
    components:
    {
        route: "alt-route",
        router: "alt-router",
        anchor: "alt-a",
    }
}