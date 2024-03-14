export default 
{ 
    attributes:
    {
        path: "path",
        useShadow: "use-shadow",
        locationMatching: "match",
        locationMatchingValues:
        {
            part: "part",
            exact: "exact",
            none: "none"
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
        form: "alt-form"
    }
}