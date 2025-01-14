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

        staticRouting: false,
        propagateStaticRouting: undefined,
        subRoutesSelector: ":scope>route",

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