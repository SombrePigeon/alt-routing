export default 
{ 
    
    template: 
    {
        cached: false
        //use request object instead
    },
    style:
    {
        global: "/css/style.css",
        route: "/css/route.css"
    },
    content:
    {
        //use request object
    },
    route:
    {
        useShadow: true,
        shadowRootInit: 
        {
            mode: "open"
        },
        loadNav: false,
        keepChildRoutes: true,
        //propagateKeepChildRoutes: null
    },
    targetNavigation:
    {
        origins:["http://training.localhost"],
        targets:["http://training.localhost"],
        timeout: 10//ms
    }

}