
console.log("dev mode will reload every 1 secs");
let currenHash = null;
setInterval(function() {
    fetch("/hash.txt").then((response) =>
    {
        return response.text();
    }).then((hash) =>
    {
        if(!currenHash)
        {
            currenHash = hash;
            console.log("init refresh on change");
        }
        else if(currenHash != hash)
        {
            console.log("change detected");
            currenHash = hash;
            window.location.href = window.location;
        }
    })
 }, 1000);

export default 
class Refresh extends HTMLElement
{
    /*toDo html element that can auto refresh*/
}
