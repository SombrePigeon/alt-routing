export default 
{ 
    style:
    {
        global: "/css/style.css",
        route: "/css/route.css"
    },
    route:
    {
        useShadow: false,
        shadowRootInit: 
        {
            mode: "open"
        },
        localNav: false,
        staticRouting: false,
        propagateStaticRouting: undefined
    },
    routeur:
    {

    },
    anchor:
    {

    },
    targetNavigation:
    {
        origins:[],
        targets:[],
        timeout: 10//ms
    }

}