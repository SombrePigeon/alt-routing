export default 
{ 
    
    template: 
    {
        cached: false
        //use request object instead
    },
    content:
    {
        //use request object
    },
    route:
    {
        useShadow: true,
        loadNav: false,
        keepChildRoutes: true
    },
    targetNavigation:
    {
        origins:["http://training.localhost"],
        targets:["http://training.localhost"],
        timeout: 10
    }

}