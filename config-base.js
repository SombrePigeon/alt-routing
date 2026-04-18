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

        showAttribute:
        {
            state: false,
        },
        //new
        localComposition: false
    },
    routeur:
    {
        features:
        {
            shadowRouting: false,
            styleShadowRouting:false,
            updateTarget: false,
            viewTransition: false,
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
        showAttribute:
        {
            locationMatch: false
        }
    }

}