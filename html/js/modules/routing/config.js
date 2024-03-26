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
        useShadow: false,
    },
    targetNavigation:
    {
        origins:["http://training.localhost"],
        targets:["http://training.localhost"],
        timeout: 10
    }

}