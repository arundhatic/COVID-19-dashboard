
function getDataUS(){

   Promise.all([
      d3.json('nyt_covid-19_us/us-states.json'),
      d3.json('nyt_covid-19_us/us-counties.json')
   ]).then(([states,counties]) =>  {
  // console.log(states);
  // console.log(counties);

}).catch(function(err) {
   console.log(err)
})
}
  
getDataUS();