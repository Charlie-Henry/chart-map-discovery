/* global turf c3  */

'use strict';
/**
 * Customize this impact tool by filling in the following values to match your data
 */
const config = {
  /**
   * Replace this with your Mapbox Access Token (**Do this first!**)
   */
  accessToken:
    'pk.eyJ1IjoiY2hhcmxpZTIzNDMiLCJhIjoiY2p1MzBiYWRlMDF3eTRlczdoaHFxMzl0MCJ9.juqQvFAijgos8InomJ-R7A',
  /**
   * Replace with the url of your map style
   */
  mapStyle: 'mapbox://styles/charlie2343/ckgjy2anp1kbm1amvehn0h1ql',
  /**
   * The layer within the vector tileset to use for querying
   */
  sourceLayer: 'csvData',
  /**
   * This sets the title in the sidebar and the <title> tag of the app
   */
  title: 'Austin Traffic Volumes Since COVID-19',
  /**
   * This sets the description in the sidebar
   */
  description:
    'This map shows the average traffic volumes recorded at intersections in Austin for each month compared to February 2020. Click an intersection to see the trend at that location.',
  /**
   * Data fields to chart from the source data
   */
  fields: [
    '2020-02',
    '2020-03',
    '2020-04',
    '2020-05',
    '2020-06',
    '2020-07',
    '2020-08',
    '2020-09',
    '2020-10',
    '2020-11',
    '2020-12',
    '2021-01',
    '2021-02',
    '2021-03',
    '2021-04',
    '2021-05',
    '2021-06',
    '2021-07',
    '2021-08',
    '2021-09',
    '2021-10'
  ],
  /**
   * Labels for the X Axis, one for each field
   */
  labels: [
  'Feb. 2020', 
  'Mar. 2020', 
  'Apr. 2020', 
  'May. 2020',
  'Jun. 2020',
  'Jul. 2020',
  'Aug. 2020',
  'Sep. 2020',
  'Oct. 2020',
  'Nov. 2020',
  'Dec. 2020',
  'Jan. 2021',
  'Feb. 2021',
  'Mar. 2021',
  'Apr. 2021',
  'May 2021',
  'Jun. 2021',
  'Jul. 2021',
  'Aug. 2021',
  'Sep. 2021',
  'Oct. 2021'],
  /**
   * The name of the data field to pull the place name from for chart labeling ("Total Votes in placeNameField, placeAdminField")
   */
  placeNameField: 'intersection',
  /**
   * (_Optional_) The name of the administrative unit field to use in chart labeling ("Total Votes in placeNameField, placeAdminField")
   */
  placeAdminField: '',
  /**
   * This sets what type of summary math is used to calculate the initial chart, options are 'avg' or 'sum' (default)
   * Use 'avg' for data that is a rate like turnout %, pizzas per capita or per sq mile
   */
  summaryType: 'avg',
  /**
   * Label for the graph line
   */
  dataSeriesLabel: 'Traffic Volumes',
  /**
   * Basic implementation of zooming to a clicked feature
   */
  zoomToFeature: false,
  /**
   * Color to highlight features on map on click
   * TODO: add parameter for fill color too?
   */
  highlightColor: '#fff',
  /**
   * (_Optional_) Set this to 'bar' for a bar chart, default is line
   */
  chartType: 'line',
  /**
   * The name of the vector source, leave as composite if using a studio style,
   * change if loading a tileset programmatically
   */
  sourceId: 'csvData',

  /**
   * (Experimental) Try to build a legend automatically from the studio style,
   *  only works with a basic [interpolate] expression ramp with stops */
  autoLegend: false,
  /** The number of decimal places to use when rounding values for the legend, defaults to 1 */
  autoLegendDecimals: 1,

  /**
   * Legend colors and values, ignored if autoLegend is used. Delete both if no legend is needed.
   */
  legendColors: ['#feedde', '#fdbe85', '#fd8d3c', '#e6550d', '#a63603'],
  legendValues: [60, 70, 80, 90, 100],
  /**
   * The name of your choropleth map layer in studio, used for building a legend
   */
  studioLayerName: 'choropleth-fill',
};

/** ******************************************************************************
 * Don't edit below here unless you want to customize things further
 */
/**
 * Disable this function if you edit index.html directly
 */
(() => {
  document.title = config.title;
  document.getElementById('sidebar-title').textContent = config.title;
  document.getElementById('sidebar-description').innerHTML = config.description;
})();

/**
 * We use C3 for charts, a layer on top of D3. For docs and examples: https://c3js.org/
 */
const chart = c3.generate({
  bindto: '#chart',
  data: {
    // TODO make the initial chart have as many points as the number of fields
    columns: [['data', 0, 0]],
    names: { data: config.dataSeriesLabel },
    // To make a bar chart uncomment this line
    type: config.chartType ? config.chartType : 'line',
  },
  axis: {
    x: {
      type: 'category',
      categories: config.labels,
    },
    y: {
      max : 100,
      min : 0,
    },
  },
  size: {
    height: 200,
  },
});

let bbFull;
let summaryData = [];
// For tracking usage of our templates
const transformRequest = (url) => {
  const isMapboxRequest =
    url.slice(8, 22) === 'api.mapbox.com' ||
    url.slice(10, 26) === 'tiles.mapbox.com';
  return {
    url: isMapboxRequest ? url.replace('?', '?pluginName=charts&') : url,
  };
};
mapboxgl.accessToken = config.accessToken;
const map = new mapboxgl.Map({
  container: 'map',
  style: config.mapStyle,
  center: [-97.6558,30.3998],
  // Change this if you want to zoom out further
  minZoom: 8,
  zoom: 10,
  transformRequest,
});

$(document).ready(function () {
  $.ajax({
    type: "GET",
    //YOUR TURN: Replace with csv export link
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRfCAUC4EeZ6FlopGh5ip6taqS9-vUAcy8SUDriUVOS5cqRGnmE0t4rggTceQ2WkaUPvNHGoP4c96Tl/pub?gid=2073884462&single=true&output=csv',
    dataType: "text",
    success: function (csvData) { makeGeoJSON(csvData); }
  });


function makeGeoJSON(csvData) {
  csv2geojson.csv2geojson(csvData, {
    latfield: 'latitude',
    lonfield: 'longitude',
    delimiter: ',',
    numericFields: 'most_recent,2020-02,2020-03,2020-04,2020-05,2020-06,2020-07,2020-08,2020-09,2020-10,2020-11,2020-12,2021-01,2021-02,2021-03,2021-04,2021-05,2021-06,2021-07,2021-08,2021-09,2021-10'
  }, function (err, data) {
  map.on('load', function () {

  //Add the the layer to the map
  map.addLayer({
    'id': 'csvData',
    'type': 'circle',
    'source': {
    'type': 'geojson',
      'data': data
        },
        'paint': {
        'circle-radius': 10,
        'circle-color': [
        'interpolate',
        ['linear'],
        ['get','most_recent'],
        60.0,
        '#feedde',
        70.0,
        '#fdbe85',
        80.0,
        '#fd8d3c',
        90.0,
        '#e6550d',
        100.0,
        '#a63603'],
          }
  });
  map.addLayer({
    id: 'highlight',
    type: 'circle',
    source: {
      'type': 'geojson',
      'data': data
    },
    paint: {
      'circle-color': config.highlightColor,
      'circle-radius': 10,
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'active'], false],
        0.7,
        0,
      ],
    },
  });

});
});
};
});


map.once('idle', () => {
  bbFull = map.getBounds();

  buildLegend();

  
  /** Layer for onClick highlights, to change to a fill see this tutorial: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/ */
  
  
  map.on('click', onMapClick);
  /**
   * 'In contrast to Map#queryRenderedFeatures, this function returns all features matching the query parameters,
   * whether or not they are rendered by the current style (i.e. visible). The domain of the query includes all
   * currently-loaded vector tiles and GeoJSON source tiles: this function does not check tiles outside the currently visible viewport.'
   * https://docs.mapbox.com/mapbox-gl-js/api/map/#map#querysourcefeatures
   *
   * To graph all features within the viewport, change this to queryRenderedFeatures and trigger on 'idle' or 'render'
   * */
   
  const sourceFeatures = map.querySourceFeatures(config.sourceId);
  
  processSourceFeatures(sourceFeatures);
});



document.getElementById('resetButton').onclick = () => {
  if (summaryData) {
    updateChartFromFeatures(summaryData);
    highlightFeature();
  }
  if (bbFull) {
    map.fitBounds(bbFull);
  }
};



function onMapClick(e) {
  const clickedFeature = map
    .queryRenderedFeatures(e.point)
    .filter((item) => item.layer['id'] === config.sourceId)[0];
  if (clickedFeature) {
    if (config.zoomToFeature) {
      const bb = turf.bbox(clickedFeature.geometry);
      map.fitBounds(bb, {
        padding: 150,
      });
    }
    highlightFeature(clickedFeature.id);
    updateChartFromClick(clickedFeature);
  }
}

function processSourceFeatures(features) {
  const uniqueFeatures = filterDuplicates(features);
  
  const data = uniqueFeatures.reduce(
    (acc, current) => {
      config.fields.forEach((field, idx) => {
        acc[idx] += current.properties[field];
      });
      return acc;
    },
    config.fields.map(() => 0),
  );
  // Save the queried data for resetting later
  console.log(uniqueFeatures)
  console.log(data)
  
  if (config.summaryType === 'avg') {
    summaryData = data.map((i) => i / uniqueFeatures.length);

  } else {
    summaryData = data;
  }
  updateChartFromFeatures(summaryData);
}

let activeFeatureId;
function highlightFeature(id) {
  if (activeFeatureId) {
    map.setFeatureState(
      {
        source: config.sourceId,
        sourceLayer: config.sourceLayer,
        id: activeFeatureId,
      },
      { active: false },
    );
  }
  if (id) {
    map.setFeatureState(
      {
        source: config.sourceId,
        sourceLayer: config.sourceLayer,
        id,
      },
      { active: true },
    );
  }
  activeFeatureId = id;
}
// Because tiled features can be split along tile boundaries we must filter out duplicates
// https://docs.mapbox.com/mapbox-gl-js/api/map/#map#querysourcefeatures
function filterDuplicates(features) {
  return Array.from(new Set(features.map((item) => item.id))).map((id) => {
    return features.find((a) => a.id === id);
  });
}

function updateChartFromFeatures(features) {
  chart.load({
    columns: [['data'].concat(features)],
    names: { data: `${config.dataSeriesLabel}` },
  });
}

/**
 * This function takes in the clicked feature and builds a data object for the chart using fields
 * specified in the config object.
 * @param {Object} feature
 */

 
function updateChartFromClick(feature) {
  const data = config.fields.reduce((acc, field) => {
    acc.push(feature.properties[field]);
    return acc;
  }, []);

  chart.load({
    columns: [['data'].concat(data)],
    names: {
      // Update this to match data fields if you don't have the same data schema, it will look for `name` and `state_abbrev` fields
      data: config.placeAdminField
        ? `${config.dataSeriesLabel} in ${
            feature.properties[config.placeNameField]
          }, ${feature.properties[config.placeAdminField]}`
        : `${config.dataSeriesLabel} in ${
            feature.properties[config.placeNameField]
          }`,
    },
  });
}

/**
 * Builds out a legend from the viz layer
 */

 
function buildLegend() {
  const legend = document.getElementById('legend');
  const legendColors = document.getElementById('legend-colors');
  const legendValues = document.getElementById('legend-values');

  if (config.autoLegend) {
    legend.classList.add('block-ml');
    const style = map.getStyle();
    const layer = style.layers.find((i) => i.id === config.studioLayerName);
    const fill = layer.paint['circle-color'];
    // Remove the interpolate expression to get the stops
    const stops = fill.slice(3);
    stops.forEach((stop, index) => {
      // Every other value is a value, and then a color. Only iterate over the values
      if (index % 2 === 0) {
        // Default to 1 decimal unless specified in config
        const valueEl = `<div class='col align-center'>${stop.toFixed(
          typeof config.autoLegendDecimals !== 'undefined'
            ? config.autoLegendDecimals
            : 1,
        )}</div>`;
        const colorEl = `<div class='col h12' style='background-color:${
          stops[index + 1]
        }'></div>`;
        legendColors.innerHTML += colorEl;
        legendValues.innerHTML += valueEl;
      }
    });
  } else if (config.legendValues) {
    legend.classList.add('block-ml');
    config.legendValues.forEach((stop, idx) => {
      const key = `<div class='col h12' style='background-color:${config.legendColors[idx]}'></div>`;
      const value = `<div class='col align-center'>${stop}</div>`;
      legendColors.innerHTML += key;
      legendValues.innerHTML += value;
    });
  }
}
