
function updatesStates(){

    const urlStates = "nyt_covid-19_us/us-states.json";
  
    d3.json(urlStates).then(statesData => {
       // console.log(statesData)
        
}).catch(err => console.log(err));  
}

function updatesCounties(){

  const urlCounties = "nyt_covid-19_us/us-counties.json";

  d3.json(urlCounties).then(countiesData => {
     // console.log(countiesData)
      
}).catch(err => console.log(err));  
}



updatesStates();
updatesCounties();
  