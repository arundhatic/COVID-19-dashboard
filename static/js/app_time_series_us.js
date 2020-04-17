/* ---------------------------------------------- */
/* helper functions Beginning */
/* ---------------------------------------------- */
var groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

function sumSimilarKeysArrStateObjs(arrObjs){
  return arrObjs.reduce(function(acc, val){
     var o = acc.filter(function(obj){
         return obj.Province_State==val.Province_State;
     }).pop() || {Province_State:val.Province_State, confirmed_cases:0};
     
     o.confirmed_cases += val.confirmed_cases;
     acc.push(o);
     return acc;
 },[]);
 }
 
 function sumSimilarKeysArrObjsStateDeath(arrObjs){
   return arrObjs.reduce(function(acc, val){
      var o = acc.filter(function(obj){
          return obj.Province_State==val.Province_State;
      }).pop() || {Province_State:val.Province_State, death:0};
      
      o.death += val.death;
      acc.push(o);
      return acc;
  },[]);
  }

  function creatNewArrOfObjectsStates(arrObj1, arrObj2){
    
     for(let i = 0; i < arrObj1.length; i++){
        arrObj1[i][0]['death'] = Object.values(arrObj2[i])[0]['death'];
     }
       console.log(arrNewObj);
      
   }

   function creatNewArrOfObjectsStates(arrObjConfirmed, arrObjDeath){
     let arrNewObj = [];
     
     for(let i = 0; i < arrObjConfirmed.length; i++){
        let newObj = {}
        newObj['Province_State'] = arrObjConfirmed[i]['Province_State'];
        newObj['confirmed_cases_excluding_death'] = arrObjConfirmed[i]['confirmed_cases'] - arrObjDeath[i]['death'];
        newObj['death'] = arrObjDeath[i]['death'];
        arrNewObj.push(newObj)
     }
       //console.log(arrNewObj);
       return arrNewObj
   }

/* ---------------------------------------------- */
/* data parsing */
/* ---------------------------------------------- */

function getDataUS(){

  Promise.all([
     d3.json('csse_covid_19_time_series/time_series_covid19_confirmed_US.json'),
     d3.json('csse_covid_19_time_series/time_series_covid19_deaths_US.json'),
     d3.json('population_data/data.json')
  ]).then(([confirmed, deaths, population]) =>  {
  //console.log(confirmed);
  //console.log(deaths);
 //console.log(population)
  for (var lastProperty in confirmed[0]);
 // console.log(lastProperty)

   var arrObjsConfirmed = confirmed.map((item) => {
            return {
               Province_State: item['Province_State'],
              'confirmed_cases': +item[lastProperty]
            } 
          });

  var arrObjsDeath = deaths.map((item) => {
           return {
                    Province_State: item['Province_State'],
                 'death': +item[lastProperty]
           } 
      });

//  console.log( arrObjsConfirmed)

var resultConfirmed = sumSimilarKeysArrStateObjs(arrObjsConfirmed).filter((d, index, self) =>
index === self.findIndex((t) => (
  t.Province_State === d.Province_State && t.confirmed_cases === d.confirmed_cases
))
);

//console.log(resultConfirmed)


var resultDeath = sumSimilarKeysArrObjsStateDeath(arrObjsDeath).filter((d, index, self) =>
index === self.findIndex((t) => (
  t.Province_State === d.Province_State && t.death === d.death
))
);

var casesUS = creatNewArrOfObjectsStates(resultConfirmed,resultDeath)

for (let i = 0; i < casesUS.length; i ++){
 // console.log(casesUS[i].Province_State.toString())
  let filterPopulation = {
      'State': casesUS[i]['Province_State']
    };
    let populationState = multiFilter(population.data, filterPopulation);
    //console.log(populationState[0] )

    if(populationState && populationState[0] && populationState[0].Pop){
      if(casesUS[i]['Province_State'] === 'West Virginia'){
        casesUS[i]['population'] = populationState[1]['Pop'];// 1st one is virgia in the search
       } else{
        casesUS[i]['population'] = populationState[0]['Pop'];
       }

    }

  if (casesUS[i]['population']){
    let popRatio = Math.abs(casesUS[i]['population']/1000000)
    casesUS[i]['per_million_cases_excluding_deaths'] = (casesUS[i]['confirmed_cases_excluding_death']/popRatio).toFixed(2);
    casesUS[i]['per_million_deaths'] = (casesUS[i]['death']/popRatio).toFixed(2);
  }
}

casesUS = casesUS.filter(d => d.per_million_cases_excluding_deaths );// get the data that is non NaN

 casesUS.forEach(b => {
   b.per_million_cases_excluding_deaths = +b.per_million_cases_excluding_deaths
   b.per_million_deaths = +b.per_million_deaths

})// convert to a number

//console.log(casesUS)

var ctx = document.getElementById("stackedBarChart").getContext('2d');

var original = Chart.defaults.global.legend.onClick;
Chart.defaults.global.legend.onClick = function(e, legendItem) {
  update_caption(legendItem);
  original.call(this, e, legendItem);
};

var stackedBarChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: casesUS.sort((a,b)=> b.per_million_cases_excluding_deaths - a.per_million_cases_excluding_deaths).map(b => b.Province_State).slice(0,30),
    datasets: [{
      label: "Per Mil Confirmed Cases Excluding Deaths",
      backgroundColor: "#88C1F2",
      hoverBackgroundColor: "#88C1F2",
      data: casesUS.sort((a,b)=> b.per_million_cases_excluding_deaths - a.per_million_cases_excluding_deaths).map(b => b.per_million_cases_excluding_deaths).slice(0,30),
    }, {
      label: "Per Mil Deaths",
      backgroundColor: "#8C4A32",
      hoverBackgroundColor: "#8C4A32",
      data: casesUS.sort((a,b)=> b.per_million_deaths - a.per_million_deaths).map(b => b.per_million_deaths).slice(0,30)
    }]
  },
  
});

var labels = {
  "Per Mil Confirmed Cases Excluding Deaths": true,
  "Per Mil Deaths": true
};

var caption = document.getElementById("caption");

var update_caption = function(legend) {
  labels[legend.text] = legend.hidden;

  var selected = Object.keys(labels).filter(function(key) {
    return labels[key];
  });

  var text = selected.length ? selected.join(" & ") : "nothing";
  caption.innerHTML;

};


}).catch(function(err) {
  console.log(err)
})
}
 
getDataUS();

var filterCounty = {
    "county": "San Diego"
  };
  
    
function getDataSanDiego(){
  
    Promise.all([
       d3.json("nyt_covid-19_us/us-counties.json"),
       d3.json("nyt_covid-19_us/us-states.json"),
       
    ]).then(([counties,states]) =>  {
  
  //   console.log(counties)
    var sanDiegoData = multiFilter(counties,filterCounty);
  //  console.log(sanDiegoData)

var arrObjs = sanDiegoData.map((item) => {
            return {
              'date': item['date'],
              'confirmed_cases': +item['cases'],
              'deaths': +item['deaths']
            } 
          });

  //console.log(arrObjs)

  const newArrayHeaders = [...Object.keys(arrObjs[0])]

  const arrValues = arrObjs.map((obj)=> {
              return Object.values(obj)
              })
    
   const dataSet = [[...newArrayHeaders],...arrValues.slice((arrValues.length - 20), arrValues.length)]
  // console.log(dataSet)

   google.charts.load('current', {'packages':['bar']});
      google.charts.setOnLoadCallback(drawChart);

      function drawChart() {
        var data = google.visualization.arrayToDataTable(dataSet);

        var options = {
          title: 'COVID-19 cases in San Diego',
          hAxis: {title: 'Year', titleTextStyle: {color: '#40291C'}},
          colors: [,'#fac934','#8C4A32'],
          chart: {
            title: 'COVID-19 cases are in San Diego',
            subtitle: '',
          },
          bars: 'horizontal' // Required for Material Bar Charts. // series: [ {}, {color: 'lightgray'} ]
        };
        var chart = new google.charts.Bar(document.getElementById('barchart_material'));

        chart.draw(data, google.charts.Bar.convertOptions(options));
      }

    }).catch(function(err) {
      console.log(err)
    })
    }

  getDataSanDiego();

  

