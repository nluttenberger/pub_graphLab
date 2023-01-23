'use strict';

// global variables

//multi-collection json file: multiColl.json
//not more than 2 collections!!!
/*
per collection: read recipes, build collGraph, store collGraph
build union of collGraphs: unionGraph
build intersection of collGraphs: intersectGraph
finally, we have 4 graphs: aGraph, bGraph, unionGraph, intersectGraph
*/
const combiJSON = '{\
  "title": "Vergleich HD-YO Gemüse",\
  "ingredients": ["zwiebel", "knoblauch", "essig", "karotten"],\
  "recipes": [\
    {\
      "Gurkensalat": [\
          "gurke",\
          "zwiebel",\
          "sahne"\
      ]\
    },\
    {\
      "Karotten": [\
          "karotten",\
          "essig",\
          "öl"\
      ]\
    },\
    {\
      "Reis mit Sauce": [\
          "reis",\
          "zwiebel",\
          "öl"\
      ]\
    },\
    {\
      "Quatsch mit Knoblauch": [\
          "quatsch",\
          "essig",\
          "öl"\
      ]\
    }\
    ],\
    "collections": [\
      {\
        "HD Gemüse": {\
          "author": "Henriette Davidis",\
          "recipes": [\
            "Gurkensalat",\
            "Karotten"\
          ]\
        }\
      },\
      {\
        "YO Gemüse": {\
          "author": "Yotam Ottolenghi",\
          "recipes": [\
            "Reis mit Sauce",\
            "Quatsch mit Knoblauch"\
          ]\
        }\
      }\
    ]\
 }';

function compare() {
  const combi = JSON.parse(combiJSON);
  const rcp_from_list = combi.recipes;
  let collections = combi.collections;
  const a_coll = combi.collections[0];
  const b_coll = combi.collections[1];
  const a_auth = Object.values(a_coll)[0].author;
  const b_auth = Object.values(b_coll)[0].author;
  const a_rcp = Object.values(a_coll)[0].recipes;
  const b_rcp = Object.values(b_coll)[0].recipes;
  let a_ingredients = [];
  let b_ingredients = [];

  a_rcp.forEach((rcp) => {
    //console.log (rcp)
    let obj = rcp_from_list.filter(e => {
      return Object.keys(e)[0] === rcp
    });
    a_ingredients = _.union (a_ingredients, Object.values(obj[0])[0]);
    a_ingredients.sort((a,b) => a.localeCompare(b, 'de-DE-1996'))
    //build complete recipe graph from ingredients
  })

  b_rcp.forEach((rcp) => {
    //console.log (rcp)
    let obj = rcp_from_list.filter(e => {
      return Object.keys(e)[0] === rcp
    });
    b_ingredients = _.union (b_ingredients, Object.values(obj[0])[0]);
    b_ingredients.sort((a,b) => a.localeCompare(b, 'de-DE-1996'))
    //build complete recipe graph from ingredients
  })
  let disUnion = _.union(a_ingredients, b_ingredients);
  disUnion.sort((a,b) => a.localeCompare(b, 'de-DE-1996'));
  let intersect = _.intersection(a_ingredients,b_ingredients);
  intersect.sort((a,b) => a.localeCompare(b, 'de-DE-1996'));
  console.log('a ingredients:  ', a_ingredients);
  console.log('b ingredients:  ', b_ingredients);
  console.log('distinct union: ', disUnion)
  console.log('intersection:   ', intersect)
}
