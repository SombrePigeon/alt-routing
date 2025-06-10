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
     
        locationMatchExact: "fresh",
        locationMatchPart: "still",
        locationMatchNone: "hidden",

        staticRouting: false,
        propagateStaticRouting: undefined,
        
        routingSelector: `:scope>${namings.components.route}`,

        localNav: false,
        staticNav: false,
        navSelector: ":scope>nav",

        showAttribute:
        {
            locationMatch: false,
            state: false,
            status: false
        }
    },
    routeur:
    {
        features:
        {
            shadowRouting: false,
            styleShadowRouting:false,
            updateTarget: false
        },
        extends: "main"
        
    },
    anchor:
    {
        showAttribute:
        {
            locationMatch: false
        }
    },
    slot:
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