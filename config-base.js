import namings from "./namings.js";

export default 
{ 
    route:
    {
        useShadow: false,
        shadowRootInit: 
        {
            mode: "open"
        },
        shadowStyle: undefined,

        loadOnPartMatching: true,

        staticRouting: false,
        propagateStaticRouting: undefined,
        routingSelector: `:scope>${namings.components.route}`,

        localNav: false,
        staticNav: false,
        navSelector: ":scope>nav",
    },
    routeur:
    {

    },
    anchor:
    {

    },
    form:
    {

    },
    targetNavigation:
    {
        origins:[],
        targets:[],
        timeout: 10//ms
    }

}