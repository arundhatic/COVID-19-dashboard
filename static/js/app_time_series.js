
/* ---------------------------------------------- */
/* helper functions Beginning */
/* ---------------------------------------------- */
function renameProperty(obj) {
  let newObject = {};
  Object.entries(obj).forEach(([key, value])=>{
    newObject[key.split("/").join("_")] = value
    })

    return newObject;
}

function convertToTable(data){
  let csv = '';
  let header = Object.keys(data).join(',');
  let values = Object.values(data).map(item => Object.values(item));
  
  csv += header + '\n' + values;
//  console.log(csv)
 // console.log(d3.csvParse(csv));
 return d3.csvParse(csv);

}

function convertValuesToArray(obj){
  return Object.entries(obj).map(([key,value]) => value)
}

function convertArrayObjects(obj){
  var arr = Object.keys(obj).map(function (key) {
    return { [key]: obj[key] };
  });
  
 // console.log(result);
  return arr;
}

 function creatNewArrOfObjects(arrDate, arrObjConfirmed, arrObjDeath, arrObjRecovered){
  let arrNewObj = [];
  
  for(let i = 0; i < arrDate.length; i++){
     let newObj = {}
     newObj['date'] = arrDate[i];
     newObj['active'] = Math.abs(Object.values(arrObjConfirmed[i])[0] - Object.values(arrObjDeath[i])[0] - Object.values(arrObjRecovered[i])[0]);
     newObj['death'] = Object.values(arrObjDeath[i])[0];
     newObj['recovered'] = Object.values(arrObjRecovered[i])[0];
     arrNewObj.push(newObj)
  }
    //console.log(arrNewObj);
    return arrNewObj
}

const multiFilter = (arr, filters) => {
  const filterKeys = Object.keys(filters);
  return arr.filter(eachObj => {
    return filterKeys.every(eachKey => {
      if (!filters[eachKey].length) {
        return true; // passing an empty filter means that filter is ignored.
      }
      return filters[eachKey].includes(eachObj[eachKey]);
    });
  });
};

// the list can be changed as required
const arrayKeysRemoved = ['Province_State', 'Country_Region', 'Lat', 'Long']

function removeProperties(obj,arrayKeysRemoved ){
  var result = _.omit(obj, arrayKeysRemoved);
  //console.log(result);
  return result;
}

function keepProperties(obj, keepList) {
  for (var prop in obj) {
      if (keepList.indexOf( prop ) == -1) {
          delete obj[prop];
      }             
  }
}

/* ---------------------------------------------- */
/* helper functions End */
/* ---------------------------------------------- */

/* ---------------------------------------------- */
/* data parsing */
/* ---------------------------------------------- */

function init(){

  var selector = d3.select("#selCountry");

  const urlCountry = "csse_covid_19_time_series/time_series_covid19_confirmed_global.json";
   d3.json(urlCountry).then(countriesData => {
     var newObjectCountry = countriesData.map(d => renameProperty(d)).map(d => d.Country_Region);
    
     uniqueCountryList = [...new Set(newObjectCountry)];// remove duplicates

   var options = selector.selectAll("option")
     .data(uniqueCountryList)
     .enter()
     .append("option")
     .attr("value", function(d) {
       return d;
     })
     .text(function(d) {
       return d;
     });
   
   options.property("selected", function(d){return d === "US"});

var indexUS = uniqueCountryList.findIndex(x => x ==="US");

const selectedCountry = uniqueCountryList[indexUS];
getDataTimeSeries(selectedCountry)
getDataTimeSeriesSumary(selectedCountry)

}).catch(err => console.log(err));  
}

init();

function getDataTimeSeriesSumary(country){

  var filters = {
      "Country/Region": country
    };
    
  Promise.all([
      d3.json('csse_covid_19_time_series/time_series_covid19_confirmed_global.json'),
      d3.json('csse_covid_19_time_series/time_series_covid19_deaths_global.json'),
      d3.json('csse_covid_19_time_series/time_series_covid19_recovered_global.json'),
  ]).then(([confirmed, deaths, recovered]) =>  {
    //console.log(confirmed)
    var confirmedData = multiFilter(confirmed,filters);
    var deathData = multiFilter(deaths,filters);
    var recoveredData = multiFilter(recovered,filters);
   
    // renaming the properties that has '/' to '_', this step can be excluded if the naming convension is followed
    var newConfirmedObjectArr = confirmedData.map(d => renameProperty(d)).map((d) => removeProperties(d,arrayKeysRemoved )) 
    var  newDeathObjectArr= deathData.map(d => renameProperty(d)).map((d) => removeProperties(d,arrayKeysRemoved )) 
    var  newRecoveredObjectArr= recoveredData.map(d => renameProperty(d)).map((d) => removeProperties(d,arrayKeysRemoved )) 
    //console.log(newConfirmedObjectArr);
  
    const arrDates = newConfirmedObjectArr.map(obj => Object.keys(obj))
   //console.log(arrDates)
  
    const arrValuesConfirmed = newConfirmedObjectArr.map(obj => Object.values(obj))
    const arrValuesDeath = newDeathObjectArr.map(obj => Object.values(obj))
    const arrValuesRecovered = newRecoveredObjectArr.map(obj => Object.values(obj))
    //console.log(arrValuesDeath)
   // console.log(arrValuesConfirmed.map(arr => arr.map(Number))); // calculate sum of multiple arrays
  
    var sumArrayConfirmed = arrValuesConfirmed.map(arr => arr.map(Number)).reduce( (a,b) => a.map( (c,i) => c + b[i] ));
    var sumArrayDeath = arrValuesDeath.map(arr => arr.map(Number)).reduce( (a,b) => a.map( (c,i) => c + b[i] ));
    var sumArrayRecovered = arrValuesRecovered.map(arr => arr.map(Number)).reduce( (a,b) => a.map( (c,i) => c + b[i] ));
    
    // convert key value pair to array of objects,format required for plotting
    var arrDatesConfirmed= convertArrayObjects(sumArrayConfirmed);
    var arrDatesDeath = convertArrayObjects(sumArrayDeath);
    var arrDatesRecovered = convertArrayObjects(sumArrayRecovered);
      
    var arrDatesConfirmedDeathCount = creatNewArrOfObjects(arrDates[0],arrDatesConfirmed,arrDatesDeath, arrDatesRecovered);
      arrDatesConfirmedDeathCount.map((d) => {
            const arrayKeysKeep = [ 'active', 'death','recovered']
            return keepProperties(d,arrayKeysKeep)
          });

      var dataSelector = d3.select('#sumary');
      dataSelector.html("");

        Object.entries(arrDatesConfirmedDeathCount [arrDatesConfirmedDeathCount.length -1]).forEach(([key,value]) =>{
            dataSelector.append('p').text(`${key}: ${value}`).append('hr')
            
        });
      

  }).catch(function(err) {
      console.log(err)
  })
  }

function getDataTimeSeries(country){

var filters = {
    "Country/Region": country
  };
  
Promise.all([
    d3.json('csse_covid_19_time_series/time_series_covid19_confirmed_global.json'),
    d3.json('csse_covid_19_time_series/time_series_covid19_deaths_global.json'),
    d3.json('csse_covid_19_time_series/time_series_covid19_recovered_global.json'),
]).then(([confirmed, deaths, recovered]) =>  {
  //console.log(confirmed)

  var confirmedData = multiFilter(confirmed,filters);
  var deathData = multiFilter(deaths,filters);
  var recoveredData = multiFilter(recovered,filters);
 
  // renaming the properties that has '/' to '_', this step can be excluded if the naming convension is followed
  var newConfirmedObjectArr = confirmedData.map(d => renameProperty(d)).map((d) => removeProperties(d,arrayKeysRemoved )) 
  var  newDeathObjectArr= deathData.map(d => renameProperty(d)).map((d) => removeProperties(d,arrayKeysRemoved )) 
  var  newRecoveredObjectArr= recoveredData.map(d => renameProperty(d)).map((d) => removeProperties(d,arrayKeysRemoved )) 
  //console.log(newConfirmedObjectArr);

  const arrDates = newConfirmedObjectArr.map(obj => Object.keys(obj))
 //console.log(arrDates)

  const arrValuesConfirmed = newConfirmedObjectArr.map(obj => Object.values(obj))
  const arrValuesDeath = newDeathObjectArr.map(obj => Object.values(obj))
  const arrValuesRecovered = newRecoveredObjectArr.map(obj => Object.values(obj))
  //console.log(arrValuesDeath)
 // console.log(arrValuesConfirmed.map(arr => arr.map(Number))); // calculate sum of multiple arrays

  var sumArrayConfirmed = arrValuesConfirmed.map(arr => arr.map(Number)).reduce( (a,b) => a.map( (c,i) => c + b[i] ));
  var sumArrayDeath = arrValuesDeath.map(arr => arr.map(Number)).reduce( (a,b) => a.map( (c,i) => c + b[i] ));
  var sumArrayRecovered = arrValuesRecovered.map(arr => arr.map(Number)).reduce( (a,b) => a.map( (c,i) => c + b[i] ));
  
  // convert key value pair to array of objects,format required for plotting
  var arrDatesConfirmed= convertArrayObjects(sumArrayConfirmed);
  var arrDatesDeath = convertArrayObjects(sumArrayDeath);
  var arrDatesRecovered = convertArrayObjects(sumArrayRecovered);
    
  var arrDatesConfirmedDeathCount = creatNewArrOfObjects(arrDates[0],arrDatesConfirmed,arrDatesDeath, arrDatesRecovered);
  //console.log(arrDatesConfirmedDeathCount)

  const ticksDate = arrDatesConfirmedDeathCount.slice(Math.max(arrDatesConfirmedDeathCount.length - 20, 0))

  barStackedChart(ticksDate)
  
}).catch(function(err) {
    console.log(err)
})
}

function optionChanged(newCountry) {
  //console.log(newCountry)
  getDataTimeSeries(newCountry);
  getDataTimeSeriesSumary(newCountry)
    
 }

/* ---------------------------------------------- */
/* data parsing */
/* ---------------------------------------------- */


/* ---------------------------------------------- */
/* charts */
/* ---------------------------------------------- */

/* create a bar chart */
function barStackedChart(data){
  // to replace the svg that already exists
  d3.select("#barChart").selectAll("svg").remove();

   // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 50, left: 50},
    width = 800 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom, padding = 40;

    // append the svg object to the body of the page
    var svg = d3.select("#barChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

      // List of subgroups = header of the csv files = soil condition here
  var subgroups = Object.keys(data[0]).slice(1)

  //console.log(subgroups)

  // List of groups = species here = value of the first column called group -> I show them on the X axis
  var groups = d3.map(data, function(d){return(d.date)}).keys()

  //console.log(groups)

  // Add X axis
  var x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .padding([0.2])
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSizeOuter(-10)).selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end").attr("class", "axis");

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, d3.max(data, d=> (d.active + d.death + d.recovered))])
    .range([ height, 0 ]);
  svg.append("g")
    .call(d3.axisLeft(y)).attr("class", "axis");

    // ----------------
    // Create a label
    // ----------------

    svg.append("text")
        .attr("transform", `translate(${width -10 },${height +30 })`)
        .attr("class", "axis-text")
        .text("Dates")

    svg.append("text")
        .attr("transform", `translate(15,50 )rotate(270)`)
        .attr("class", "axis-text")
        .text("Cases")

    svg.append('g')
          .attr('transform', `translate(${width / 2}, ${padding - 20})`)
          .append('text')
          .attr('x', 0)
          .attr('y', 20)
          .classed('aText active', true)
          .text('COVID-19 Cases');

  // color palette = one color per subgroup
  var color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(['#fac934','#40291C','#88C1F2'])

  //stack the data? --> stack per subgroup
  var stackedData = d3.stack()
    .keys(subgroups)
    (data)

  // console.log(stackedData)

  // ----------------
  // Create a tooltip
  // ----------------
  var tooltip = d3.select("#barChart")
    .append("div")
    .attr("class", "tooltip")
    .style("background-color", 'white')
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
  

  // Show the bars
  var barGroup = svg.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .enter().append("g")
      .attr("fill", function(d) { 
        return color(d.key); })
      .selectAll("rect")
            .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d) { 
         // console.log(d.data);
          return x(d.data.date); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width",x.bandwidth());


     barGroup.on("mouseover", function(d) {
        // console.log(this.parentNode);
         var subgroupName = d3.select(this.parentNode).datum().key;
        // console.log(subgroupName);
         var subgroupValue = d.data[subgroupName];
         //console.log(subgroupValue);
         tooltip.style("display", "block")
             .html(subgroupName + " cases "+ "<br>" + "count: " + subgroupValue)
             .style("opacity", 1)
             .style("left", d3.select(this).attr("x")+ "px")
             .style("top", d3.select(this).attr("y") + "px");

       })
      .on("mouseout", function(d) {
        tooltip.style("display", "none");
      })

      // ----------------
      // Create a legend
      // ----------------

      var legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', 'translate(' + (padding + 12) + ', 0)');

            legend.selectAll('rect')
                .data(subgroups)
                .enter()
                .append('rect')
                .attr('x', 0)
                .attr('y', function(d, i){
                    return i * 18;
                })
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', function(d, i){
                    return color(i);
                });
            
            legend.selectAll('text')
                .data(subgroups)
                .enter()
                .append('text')
                .text(function(d){
                    return d;
                })
                .attr('x', 18)
                .attr('y', function(d, i){
                    return i * 18;
                })
                .attr('text-anchor', 'start')
                .attr('alignment-baseline', 'hanging');

 }

/* ---------------------------------------------- */
/* charts */
/* ---------------------------------------------- */
