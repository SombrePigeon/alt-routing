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

        loadOnPartMatching: false,

        staticRouting: false,
        propagateStaticRouting: undefined,
        subRoutesSelector: `:scope>${namings.components.route}`,

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