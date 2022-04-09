'use strict';

// global variables

let igtList;
let rcpList;
let rcpNameList =[];
let G     = new jsnx.MultiGraph(); // jsnx multigraph undirected
let H     = new jsnx.Graph();
let prev  = new Map(); // map for prevalence values
let neigh = new Map(); // map for number of node neighbors
let degr  = new Map(); // map for degree values
let betw  = new Map(); // map for betweenness values
let label = new Map(); // map for ingredient node labels
let label2Id = new Map();
let id2Label = new Map();
let id2Occ = new Map();

let fog   = null;      // fog for svg graph canvas

let svgSpaces = [      // canvas divs inside accordion tabs for svg graph instances
  "#graphSpace01",
  "#graphSpace02",
  "#graphSpace03"
]
let svgGraphs = []; // svg graph instances inside accordion tabs
let svgHist = [];   // for stepwise restoration of svg graphs after remove
let jsnxHist = [];  // for stepwise restoration of jsnx graphs after remove
const konstruktionTab = 0;   // index into svgGraphs array
const interaktionTab = 1;    // index into svgGraphs array
const experimentTab = 2;     // index into svgGraphs array

let dataTable = [];          // dataTable for diagrams
const ingId = 0;             // column indices for dataTable
const Label = 1;
const Prävalenz = 2;
const Nachbarn = 3;
const Knotengrad = 4;
const Betweenness = 5;
const KantenID = 6;
const Mehrfachkanten = 7;

let btnIds   = [undefined,undefined,'btnPrev','btnNeigh','btnDegr','btnBetw'];
let btnState = [undefined,undefined,true,true,true,true];  // button state for toggle button
let chartSpaces = [undefined,undefined,'barChartPrev','barChartNeigh','barChartDegree','barChartBetween'];
let chartAreas = [];

let distinctMultiEdgesSorted;

let ctRecipes;
let ctIngredients;
let avgNumberIngredientsPerRecipe;
let ctEdges;
let ctMultiEdges;
let ctDistinctEdges;
let ctDistinctMultiEdges;
let avgCountNeighbors;
let avgCountDistinctNeighbors;
let density;
let connectedComponents;

// here is where it all starts:

fetchGraph();

// build graphs

function fetchGraph () { // fetch combined jsnx and svg graphs in json format, build graphs
  fetch("g_demo4Theory/combinedGraph.json", {cache: "no-store"})
    .then(function (response) {
      if (response.ok) return response.text();
    })
    .then(function (gText) {
      // store graph.json locally
      sessionStorage.setItem("srcGraph",gText);
      let graph = JSON.parse(gText);
      // build the jsnx graph
      jsnxGraphBuilder(graph);
      // build svg graph instances
      svgSpaces.forEach((space, i) => {
        svgGraphs[i] = Snap(space);/**/
      });
      svgGraphBuilder(graph);
      clack();
      dataTableBuilder();
    })
    .catch(function (err) {
      alert(err);
    });
  }

// building the jsnx and svg graphs, and the data table for diagramms

function jsnxGraphBuilder(graph) {    // build jsnx graph, compute some node properties and other values
  igtList = graph.ingredients;        // list of all ingredients
  rcpList = graph.recipes;            // list of all recipes
  // set up jsnx graph from recipe and ingredient values
  let n;
  rcpList.forEach(function(recipe){
    n = recipe.ingredients.length;
    H = jsnx.completeGraph(n,H);
    let mapping = new Map();
    recipe.ingredients.forEach ((igt, idx) => mapping.set(idx,igt));
    jsnx.relabelNodes (H,mapping,false);
    H.edges(true).forEach (function (edge) {
      let id;
      let s = edge[0];
      let t = edge[1];
      if (s<t) {id = `${s}--${t}`} else {id = `${t}--${s}`}
      H.adj.get(edge[0]).get(edge[1]).id = id;
    });
    G.addNodesFrom(H.nodes(true));
    G.addEdgesFrom(H.edges(true));
  });
  // compute number of recipes
  ctRecipes = rcpList.length;
  // compute average number of ingredients per recipe
  let sumIgtPerRecipe = 0;
  rcpList.forEach(function(recipe){
    sumIgtPerRecipe += recipe.ingredients.length;
  });
  avgNumberIngredientsPerRecipe = Math.round(100*sumIgtPerRecipe / ctRecipes) / 100;
  // build datalist for recipe dropdown menu
  rcpList.forEach (function(recipe){
    rcpNameList.push(recipe.recipeName);
    $('#'+'rcpNames').append(`<option value="${recipe.recipeName}"/>`)
  });
  // build datalist for ingredient dropdown menu
  let i;
  for (i=0;i<igtList.length;i++){
    $('#'+'igtNames').append(`<option value="${igtList[i].label}"/>`)
  }
  // helpers for ui
  label2Id.clear();
  for (let ingredient of graph.ingredients) {
    label2Id.set(ingredient.label, ingredient.id)
  }
  id2Label.clear();
  for (let ingredient of graph.ingredients) {
    id2Label.set(ingredient.id, ingredient.label)
  }
  for (let nd of G.nodes()) {
    let n = G.node.get(nd);      // node attributes object
    n.label = id2Label.get(nd);   // add label
  }
  // console.log (G.nodes(true));
  id2Occ.clear();
  for (let ingredient of graph.ingredients) {
    id2Occ.set(ingredient.id, ingredient.occurs)
  }
  // node properties
  label.clear();
  for (let ingredient of graph.ingredients) {
    label.set(ingredient.id, ingredient.label)
  }
  prev.clear();
  for (let ingredient of graph.ingredients) {
    prev.set(ingredient.id, ingredient.occurs / ctRecipes)
  }
  neigh.clear();
  for (let ingredient of graph.ingredients) {
    neigh.set(ingredient.id, G.neighbors(ingredient.id).length)
  }
  degr.clear();
  degr = jsnx.degree(G);
  betw.clear();
  betw = jsnx.betweennessCentrality(G, {'normalized': false});
  betw.forEach((v,k) => betw.set(k, Math.round(10*v)/10));
  // all other sample values are computed here
  computeSampleInfo();
}

function svgGraphBuilder(g) {  // parse graph objects from json file into svg graph
  svgGraphs.forEach((graph) => {
    let parent = graph;  // svg graph instance
    let child = parent;
    let element = g.svg;  // svg element in json file
    let kellerObj = [];
    let kellerPar = [];
    kellerObj.push(element);
    kellerPar.push(parent);
    while ((element = kellerObj.pop()) !== undefined) {
      parent = kellerPar.pop();
      for (let [key, value] of Object.entries(element)) {
        if ((typeof(value) === "object") && (Array.isArray(value) === false)) {
          child = graph.el(key);
          parent.append(child);
          kellerObj.push(value);
          kellerPar.push(child);
        } else if ((typeof(value) !== "object") && (Array.isArray(value) === false)) {
          if(key === "#text-content") {
            parent.node.innerHTML = value;
          } else if (key === "title") {
            child = graph.el(key);
            parent.append(child);
            child.node.innerHTML = value;
          } else {
            let att = key.substr((key.indexOf('#')+1),key.length);
            parent.attr({[att]: value});
          }
        }
        if (Array.isArray(value) === true) {
          for (let [k,v] of Object.entries(value)) {
            child = graph.el(key);
            parent.append(child);
            kellerObj.push(v);
            kellerPar.push(child);
          }
        }
      }
    }
  })
}

function clack() {  // attach click handlers to svg ingredient nodes and set their title elements
  svgGraphs.forEach((graph, i) => {
    graph.selectAll("[class='node']").forEach(function (nd) {
      nd.attr("cursor", "pointer");
      nd.node.onclick = function () {
        showIngredient(nd.attr('id'), graph)
      };
      if (i === experimentTab){
        nd.node.oncontextmenu = function(event) {
          event.preventDefault();
          remove(nd.attr('id'))
        }
      } else {
        nd.node.oncontextmenu = function(event) {
          event.preventDefault();
          let ingdt = nd.attr('id');
          let k, l, m = 0;
          let occ = id2Occ.get(ingdt);
          let rcpByIgt = [];
          overRcp:
            for (k = 0; k < rcpList.length; k++) {
              overRcpIgt:
                for (l = 0; l < rcpList[k].ingredients.length; l++) {
                  if (rcpList[k].ingredients[l] === ingdt) {
                    rcpByIgt.push(rcpList[k].recipeName);
                    m++;
                    if (m == occ) {
                      break overRcp;
                    }
                    break overRcpIgt;
                  }
                }
            }
          $('#' + 'rcpByIgtList').empty();
          rcpByIgt.forEach(
            rcp => $('#' + 'rcpByIgtList').append(`<button type="button" class="list-group-item list-group-item-action m-0
            p-0" onclick="showRecipeByName(svgGraphs[interaktionTab],'${rcp}')">${rcp}</button>`)
          );
          // $('#' + 'rcpByIgtBody').collapse('show');
        }
      }
      let igtID = nd.attr("id");
      let p = prev.get(igtID);
      let d = degr.get(igtID);
      let b = betw.get(igtID).toFixed(1);
      let n = neigh.get(igtID);
      let l = id2Label.get(igtID);
      nd.select("title").node.innerHTML = `${l}\nPrävalenz: ${p}\nAnz. Nachbarn: ${n}\nKnotengrad: ${d}\nBetweenness: ${b}`;
    })
  });
}

function computeSampleInfo () {
  ctIngredients = G.numberOfNodes();
  ctEdges = G.numberOfEdges();
  let edgeIds = jsnx.getEdgeAttributes(G, 'id');
  let edgeIdArr = Array.from(edgeIds.values());
  let distinctEdges = edgeIdArr.reduce(function (collector, edge) {
    if (edge in collector) {
      collector[edge]++;
    } else {
      collector[edge] = 1;
    }
    return collector;
  }, {});
  let entries = Object.entries(distinctEdges);

  ctDistinctEdges = entries.length;
  avgCountNeighbors = Math.round(200 * ctEdges / ctIngredients) / 100;
  avgCountDistinctNeighbors = Math.round(200 * ctDistinctEdges / ctIngredients) / 100;
  density = Math.round((200 * ctDistinctEdges) / (ctIngredients * (ctIngredients - 1))) / 100;
  distinctMultiEdgesSorted = entries.sort((a, b) => b[1] - a[1]);
  ctMultiEdges = 0;
  ctDistinctMultiEdges = 0;
  distinctMultiEdgesSorted.forEach((el) => {
    if (el[1] > 1) ctMultiEdges += el[1]
  });
  distinctMultiEdgesSorted.forEach((el) => {
    if (el[1] > 1) ctDistinctMultiEdges++
  });
  connectedComponents = connComp();
  $('#' + 'maxPrev').html(Math.ceil(100 * Math.max(...prev.values())));
  $('#' + 'maxNeigh').html(Math.max(...neigh.values()));
  $('#' + 'maxDegr').html(Math.max(...degr.values()));
  $('#' + 'maxBetw').html(Math.ceil(Math.max(...betw.values())));
}

function dataTableBuilder() {
  dataTable.length = 0;
  betw.forEach(function (val, key) {
    dataTable.push([key, label.get(key), prev.get(key), neigh.get(key), degr.get(key), val]);
  });
}

// svg graph functions for user interface

function handleFog(s) {  // handle fog over svg canvas
  // remove fog from previous call to show(); install fresh fog
  if (s.select("#foggy") !== null)
    s.select("#foggy").remove();
  let bbwidth = s.getBBox().width;
  let bbheight = s.getBBox().height;
  fog.attr('id','foggy');
  fog.rect(0, 0, bbwidth + 200, bbheight + 200).attr({
    fill: 'white', fillOpacity: 0.85, "cursor": "pointer"
  });
  fog.click(function () {
    fog.remove();
    fog = null;
  });
}

function showIngredient(ingredient,s) {  // ingredient node click handler
  // left click: show node and its neighbours
  fog = s.g();
  handleFog(s,fog);
  let el = s.select('#'.concat(ingredient));
  let elClone = el.clone();
  let elCloneId = el.attr("id").concat("-clone");
  elClone.attr({"id":elCloneId});
  fog.append(elClone);
  // right click: remove shown node
  elClone.node.oncontextmenu = function(event) {
    event.preventDefault();
    fog.remove();
    fog = null;
    let elId = elCloneId.substr(0,elCloneId.indexOf('-'));
    // remove node from all svg graph instances and jsnx graph
    remove(elId,s);
  };
  // append ingredient node neighbour and edge clones to fog
  let keller = [];
  s.selectAll("[class='edge']").forEach(function (el) {
    let tit = el.attr("id");
    let f = tit.substr(0, tit.indexOf('-'));
    let l = tit.substr(tit.indexOf('-') + 2);
    if (f === ingredient || l === ingredient) {
      fog.append(el.clone());
    }
    if (f === ingredient) {
      keller.push(s.select('#'.concat(l)).clone());
    }
    if (l === ingredient) {
      keller.push(s.select('#'.concat(f)).clone());
    }
  });
  keller.forEach(function(el){
    fog.append(el);
  })
}

function showIngredientByName(s) {
  let igtName = document.getElementById("igtNameInputField").value;
  let igt = label2Id.get(igtName);
  showIngredient(igt,s);
}

function showIngredientsByCat(cat,s) {  // click handler for category legend entries
  fog = s.g();
  handleFog(s,fog);
  let col = window.getComputedStyle(cat, null).getPropertyValue("background-color");
  s.selectAll("[class='node']").forEach(function (el) {
    if (el.select('ellipse').attr('fill') === col) {
      let elClone = el.clone();
      let elCloneId = el.attr("id").concat("-clone");
      elClone.attr({"id":elCloneId});
      fog.append(elClone);
      // right click: remove shown node
      elClone.node.oncontextmenu = function(event) {
        event.preventDefault();
        fog.remove();
        fog = null;
        let elId = elCloneId.substr(0,elCloneId.indexOf('-'));
        //remove node from both svg and jsnx
        remove(elId,s);
      }
    }
  })
}

function showRecipeByName(s,rcpName) {  // show recipe by recipe name
  fog = s.g();
  handleFog(s,fog);
  if (arguments.length==1) {
    rcpName = document.getElementById("rcpNameInputField").value;
  }
  let R = new jsnx.Graph();
  let i;
  for (i=0;i<rcpList.length;i++) {
    if (rcpList[i].recipeName === rcpName) {
      let n = rcpList[i].ingredients.length;
      R = jsnx.completeGraph(n, R);
      let mapping = new Map();
      rcpList[i].ingredients.forEach((igt, idx) => mapping.set(idx, igt));
      jsnx.relabelNodes(R, mapping, false);
      R.edges(true).forEach(function (edge) {
        let idArr = [];
        idArr.push(edge[0]);
        idArr.push(edge[1]);
        idArr.sort (function(a,b) {return a.localeCompare(b,'de-DE-1996')});
        R.adj.get(edge[0]).get(edge[1]).id = `${idArr[0]}--${idArr[1]}`;
      });
      R.edges(true).forEach(function (edge) {
        let edgeToFind = R.adj.get(edge[0]).get(edge[1]).id;
        let el = s.select('#'.concat(edgeToFind));
        fog.append(el.clone());
      });
      R.nodes(true).forEach (function (nd) {
        let el = s.select('#'.concat(nd[0]));
        fog.append(el.clone());
      });
      break;
    }
  }
}

// simulate button click by pressing return key
document.getElementById("oBPrev").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("btnPrevBounds").click();
  }
});
document.getElementById("oBNeigh").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("btnNeighBounds").click();
  }
});
document.getElementById("oBDegr").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("btnDegrBounds").click();
  }
});
document.getElementById("oBBetw").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("btnBetwBounds").click();
  }
});

function showByData(s,dataIdx) {  // click handler for input boxes: show nodes by data
  fog = s.g();
  handleFog(s);
  // retrieve betweenness bounds from input fields
  let ub;
  let ob;
  let graphDataMap = new Map();
  switch (dataIdx) {
    case Prävalenz :
      ub = parseFloat(document.getElementById("uBPrev").value) / 100;
      ob = parseFloat(document.getElementById("oBPrev").value) / 100;
      graphDataMap = prev;
      break;
    case Nachbarn :
      ub = parseFloat(document.getElementById("uBNeigh").value);
      ob = parseFloat(document.getElementById("oBNeigh").value);
      graphDataMap = neigh;
      break;
    case Knotengrad :
      ub = parseFloat(document.getElementById("uBDegr").value);
      ob = parseFloat(document.getElementById("oBDegr").value);
      graphDataMap = degr;
      break;
    case Betweenness :
      ub = parseFloat(document.getElementById("uBBetw").value);
      ob = parseFloat(document.getElementById("oBBetw").value);
      graphDataMap = betw;
      break;
  }
  // find keys for matching nodes
  if (ub > ob) alert("Unterer Wert größer als oberer Wert!");
  graphDataMap.forEach(function(val,key) {
    if ((val >= ub) && (val <= ob)) {
      let el = s.select('#'.concat(key));
      let elClone = el.clone();
      let elCloneId = el.attr("id").concat("-clone");
      elClone.attr({"id":elCloneId});
      fog.append(elClone);
      // right click handler to remove shown node
      elClone.node.oncontextmenu = function(event) {
        event.preventDefault();
        fog.remove();
        fog = null;
        let elId = elCloneId.substr(0, elCloneId.indexOf('-'));
        remove(elId, s);
      }
    }
  })
}

// remove, restore, reset, recompute functions

function remove(ingredient) {  // remove ingredient node and all connected edges
  // remove from svg graph instances
  svgGraphs.forEach((graph, i) => {
    if (i === experimentTab) {
      // remove ingredient node
      let rNode = graph.select('#'.concat(ingredient));
      svgHist.push(rNode);
      rNode.remove();
      // remove connected edges
      graph.selectAll("[class='edge']").forEach(function (el) {
        let tit = el.attr("id");
        let f = tit.substr(0, tit.indexOf('-'));
        let l = tit.substr(tit.indexOf('-') + 2);
        if (l === ingredient || f === ingredient) {
          let rEdge = graph.select('[id="' + tit + '"]');
          svgHist.push(rEdge);
          rEdge.remove();
        }
      })
    }
  });
  // push connected edges from jsnx graph on stack
  let jsnxEdges = jsnx.edges(G,ingredient);
  for (let jsnxEdge of jsnxEdges) {
    jsnxHist.push(jsnxEdge);
  }
  // push node on stack
  let jsnxNode = [
    ingredient,
    G.node.get(ingredient)
  ];
  let deg = jsnx.degree(G).get(ingredient);
  jsnxNode.unshift({"degree": deg});
  jsnxNode.unshift({"class": "node"});
  jsnxHist.push(jsnxNode);
  // remove node and all connected edges
  G.removeNode(ingredient);
}

function restoreGraph() {
  svgGraphs.forEach((graph, i) => {
    if (i === experimentTab) {
      let pre = graph.select(".edge:nth-of-type(1)");
      let svgLen = svgHist.length;
      for(i = 0; i < svgLen;  i++) {
        let elPopped = svgHist.pop();
        if (elPopped.attr("class") === "edge")
        pre.after(elPopped);
        else if (elPopped.attr("class") === "node") {
          graph.append(elPopped);
          break;
        }
      }
    }
  });
  let jsnxAtom = jsnxHist.pop();
  if (jsnxAtom[0].class === "node") {
    jsnxAtom.shift();
    let degCount = jsnxAtom.shift();
    G.addNode(jsnxAtom[0],jsnxAtom[1]);
    for (let k = 0; k < degCount.degree; k++) {
      jsnxAtom = jsnxHist.pop();
      G.addEdge(jsnxAtom[0],jsnxAtom[1]);
    }
  } else {
    alert ("Element popped off stack is not of class: node")
  }
}

function resetGraph() {
  G = new jsnx.MultiGraph();
  svgGraphs.forEach(graph => {graph.clear()});
  if (sessionStorage.getItem("srcGraph")){
    let gJSON = sessionStorage.getItem("srcGraph");
    let gObj = JSON.parse(gJSON);
    jsnxGraphBuilder(gObj);
    // build svg graph instances
    svgSpaces.forEach((space, i) => {
      svgGraphs[i] = Snap(space);
    });
    svgGraphBuilder(gObj);
    clack();
  }
}

function recompute() {
  label.clear();
  for (let node of G.nodes(true)) {
    label.set(node[0],node[1].label)
    // console.log (node[1].label);
  }
  neigh.clear();
  for (let node of G.nodes(true)) {
    neigh.set(node[0], G.neighbors(node[0]).length);
  }
  degr.clear();
  degr = jsnx.degree(G);
  betw.clear();
  betw = jsnx.betweennessCentrality(G, {'normalized': false});
  betw.forEach((v,k) => betw.set(k, Math.round(10*v)/10));
  console.log (betw);
  dataTableBuilder();
  computeSampleInfo();
  svgGraphs.forEach((s, i) => {
    s.selectAll("[class='node']").forEach(function (nd) {
      let igtID = nd.attr("id");
      let p = prev.get(igtID);
      let d = degr.get(igtID);
      let b = betw.get(igtID);
      let n = neigh.get(igtID);
      nd.select("title").node.innerHTML = `Prävalenz: ${p}\nAnz. Nachbarn: ${n}\nKnotengrad: ${d}\nBetweenness: ${b}`;
    })
  })
}

// charting functions

function byValue(col) {
  sortByLabel(dataTable);
  barChart(chartSpaces[col],col);
  $('#'+btnIds[col]).html('Nach Wert sortieren');
  btnState[col] = false;
}

function byName(col) {
  sortByCol(dataTable, -1,col,Label);
  barChart(chartSpaces[col],col);
  $('#'+btnIds[col]).html('Nach Namen sortieren');
  btnState[col] = true;
}

function toggleBtn(col) {
  btnState[col] ? byValue(col) : byName(col);
}

function flyIn(chartAreaId,chartSpace,col) {
  chartAreas.forEach (area => flyOut(area));
  chartAreas.push(chartAreaId);
  $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");
  sortBy(chartSpace,col,col);
}

function flyOut(chartAreaId) {
  chartAreas.pop();
  $('#' + chartAreaId).toggleClass('stretchRight stretchLeft').css("visibility", "visible");
}

function flyInFacts(chartAreaId) {
  chartAreas.forEach (area => flyOut(area));
  chartAreas.push(chartAreaId);
  $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");
  $('#' + 'ctRecipes').html(ctRecipes);
  $('#' + 'ctIngredients').html(ctIngredients);
  $('#' + 'avgNumberIngredientsPerRecipe').html(avgNumberIngredientsPerRecipe);
  $('#' + 'ctEdges').html(ctEdges);
  $('#' + 'ctMultiEdges').html(ctMultiEdges);
  $('#' + 'ctDistinctEdges').html(ctDistinctEdges);
  $('#' + 'ctDistinctMultiEdges').html(ctDistinctMultiEdges);
  $('#' + 'avgCountNeighbors').html(avgCountNeighbors);
  $('#' + 'avgCountDistinctNeighbors').html(avgCountDistinctNeighbors);
  $('#' + 'density').html(density);
  $('#' + 'ctComponents').html(connectedComponents);
}

function flyInMultipleEdgesHeatmap(chartAreaId,chartSpace) {
  chartAreas.forEach (area => flyOut(area));
  chartAreas.push(chartAreaId);
  $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");
  let xLab = [];
  let yLab = [];
  let zVal = [];
  let i;
  for (i=0;i<150;i++) {
    let xx = distinctMultiEdgesSorted[i];
    let x = xx[0].substr(0, xx[0].indexOf('-'));
    xLab.push(id2Label.get(x));
    let y = xx[0].substr(xx[0].indexOf('-') + 2);
    yLab.push(id2Label.get(y));
    let z = xx[1];
    zVal.push(z);
  }
  let trace1 = {
    x: xLab,
    y: yLab,
    mode: 'markers',
    marker: {
      color: 'rgb(66,114,138)',
      size: zVal
    },
    text: zVal,
    textfont: {color: 'rgb(128,128,128)'}
  };
  let layout = {
    xaxis: {side: 'top'},
    yaxis: {autorange: "reversed", automargin: true},
    font: {color: 'rgb(128,128,128)'}
  };
  let data = [trace1];
  Plotly.newPlot(chartSpace,data,layout);
}

function flyInMultipleEdges(chartAreaId,chartSpace) {
  chartAreas.forEach (area => flyOut(area));
  chartAreas.push(chartAreaId);
  $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");
  let xVal = [];
  let yVal = [];
  let i;
  for (i=0;i<50;i++) {
    let x = distinctMultiEdgesSorted [i];
    xVal[i] = x[1];
    yVal[i] = x[0];
  }
  let trace1 = {
    x: xVal,
    y: yVal,
    type: 'bar',
    text: xVal.map(String),
    textposition: 'outside',
    hoverinfo: 'none',
    orientation: 'h',
    marker: {
      color: 'rgb(66,114,138)',
    },
    textfont: {
      color: 'black'
    }
  };
  let data = [trace1];
  let layout = {
    xaxis: {side: 'top'},
    yaxis: {autorange: "reversed", automargin: true},
    font: {color: 'rgb(128,128,128)'},
    margin: {t: 16}
  };
  Plotly.newPlot(chartSpace, data, layout);
}

function barChart(chartSpace, col) { // plot bar chart
  let xVal = [];
  let yVal = [];
  xVal[0] = [];
  xVal[1] = [];
  xVal[2] = [];
  xVal[3] = [];
  yVal[0] = [];
  dataTable.forEach(function (el, i) {
    xVal[0][i] = el[Prävalenz];
    xVal[1][i] = el[Nachbarn];
    xVal[2][i] = el[Knotengrad];
    xVal[3][i] = el[Betweenness];
    yVal[0][i] = el[Label];
  });
  let trace1 = {
    name: 'Prävalenz',
    x: xVal[0],
    y: yVal[0],
    type: 'bar',
    text: xVal[0].map(String),
    textposition: 'outside',
    hoverinfo: 'none',
    orientation: 'h',
    marker: {
      color: '##82CF63'
    },
    textfont: {
      color: 'rgb(128,128,128)'
    }
  };
  let trace2 = {
    name: 'Anz. Nachbarn',
    x: xVal[1],
    y: yVal[0],
    type: 'bar',
    text: xVal[1].map(String),
    textposition: 'outside',
    hoverinfo: 'none',
    orientation: 'h',
    marker: {
      color: '#63C8CF'
    },
    textfont: {
      color: 'rgb(128,128,128)'
    }
  };
  let trace3 = {
    name: 'Knotengrad',
    x: xVal[2],
    y: yVal[0],
    type: 'bar',
    text: xVal[2].map(String),
    textposition: 'outside',
    hoverinfo: 'none',
    orientation: 'h',
    marker: {
      color: '#9063CF'
    },
    textfont: {
      color: 'rgb(128,128,128)'
    }
  };
  let trace4 = {
    name: 'Betweenness',
    x: xVal[3],
    y: yVal[0],
    type: 'bar',
    text: xVal[3].map(String),
    textposition: 'outside',
    hoverinfo: 'none',
    orientation: 'h',
    marker: {
      color: '#CF637B'
    },
    textfont: {
      color: 'rgb(128,128,128)'
    }
  };
  let data = [trace1,trace2,trace3,trace4];
  let layout = {
    xaxis:  {side: 'top'},
    yaxis:  {autorange: "reversed", automargin: true},
    font:   {color: 'rgb(128,128,128)'},
    margin: {t: 16}
  };
  Plotly.newPlot(chartSpace, data, layout);
}

function sortBy(chartSpace, colData, colSort) {
  if (colSort===Label) {sortByLabel(dataTable)}
  else {sortByCol(dataTable, -1, colSort, Label)};
  // Plotly.purge(document.getElementById(chartSpace));
  barChart(chartSpace, colData);
}

function sortByCol(arr, reverse, colIdx1, colIdx2) {
  arr.sort(sortFunction);
  function sortFunction(a, b) {
    let x = (isNaN(a[colIdx1]-b[colIdx1]) ? (a[colIdx1] === b[colIdx1]) ? 0 : (a[colIdx1] < b[colIdx1]) ? -1 : 1 : a[colIdx1]-b[colIdx1]) ||
      (isNaN(a[colIdx2]-b[colIdx2]) ? (a[colIdx2] === b[colIdx2]) ? 0 : (a[colIdx2] < b[colIdx2]) ? -1*reverse : 1*reverse : a[colIdx2]-b[colIdx2]);
    return (x*reverse);
  }
}

function sortByLabel(arr) {
  arr.sort(sortFunction);
  function sortFunction(a, b) {
    let x = (isNaN(a[Label]-b[Label]) ? (a[Label] === b[Label]) ? 0 : (a[Label] < b[Label]) ? -1 : 1 : a[Label]-b[Label]);
    return (x);
  }
}

function connComp() {  // compute connected components
  function init() {
    for (let nd of G.nodes()) {
      let n = G.node.get(nd);  // node attributes object
      n.cc = 0;                // connected component attribute
    }
  }
  function dfs(nd,countCC) {   // depth first search
    let n = G.node.get(nd);    // node attributes object
    n.cc = countCC;
    for (let neighbor of jsnx.neighbors(G,nd)) {
      let n = G.node.get(neighbor);
      if (n.cc === 0) {
        n.cc = countCC;
        dfs(neighbor, countCC);
      }
    }
  }
  init();
  let countCC = 0;
  for (let nd of G.nodes()) {
    let n = G.node.get(nd);
    if (n.cc === 0) {
      countCC++;
      dfs(nd,countCC);
    }
  }
  let nodesCC = G.nodes(true);
  let cc = [];                                  // result array of arrays
  for (let i = 1; i <= countCC; i++) {          // loop over connected components
    let temp = [];
    for (let j = 0; j < nodesCC.length; j++) {  // loop over source array
      if (nodesCC[j][1].cc === i) {
        temp.push(nodesCC[j]);
      }
    }
    cc[i-1] = temp;
  }
  return (cc.length);
}
