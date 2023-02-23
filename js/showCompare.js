  'use strict';

console.log ('v03');

  // global variables
  let myColl;                   // collection name from URL query param
  let igtList;
  let rcpList;
  let rcpNameList = [];
  // jsnx undirected graph with weight attribute
  let G = new jsnx.Graph();
  let A = new jsnx.Graph();
  let B = new jsnx.Graph();
  let Intersect = new jsnx.Graph();
  // jsnx undirected graph with weight attribute
  let G1 = new jsnx.Graph();
  let Gclone;
  let H = new jsnx.Graph();
  // map for prevalence values
  let prev = new Map();
  // map for occurence values
  let occ = new Map();
  // map for number of node neighbors
  let neigh = new Map();
  // map for degree values
  let degr = new Map();
  // map for betweenness values
  let betw = new Map();
  // map for ingredient node labels
  let label = new Map();

  let label2Id  = new Map();
  let id2Label  = new Map();
  let id2Occ    = new Map();
  let id2Weight = [];

  let cat2Text = new Map;
  cat2Text.set('i-meat', 'Fleisch');
  cat2Text.set('i-fish', 'Fisch');
  cat2Text.set('i-herb', 'Kräuter');
  cat2Text.set('i-spice', 'Gewürz');
  cat2Text.set('i-veg', 'Gemüse');
  cat2Text.set('i-fruit', 'Frucht');
  cat2Text.set('i-onion', 'Zwiebel');
  cat2Text.set('i-nuts', 'Nüsse');
  cat2Text.set('i-carb', 'Kohlenhydrate');
  cat2Text.set('i-sweet', 'süß');
  cat2Text.set('i-alc', 'Alkohol');
  cat2Text.set('i-condi', 'Würze');
  cat2Text.set('i-milk', 'Milch');
  cat2Text.set('i-egg', 'Ei');
  cat2Text.set('i-fat', 'Fett');
  cat2Text.set('i-etc', 'etc');

  let vB;
  let BBh;
  let BBw;
  let fog = null;
  // fog for svg graph canvas
  let svgSpaces = [   // canvas divs inside accordion tabs for svg graph instances
    "#graphSpace01"
  ];
  let svgGraphs = [];
  // svg graph instances inside accordion tabs
  let svgHist = [];
  // for stepwise restoration of svg graphs after remove
  let jsnxHist = [];
  // for stepwise restoration of jsnx graphs after remove
  const konstruktionTab = 0;
  // index into svgGraphs array
  const interaktionTab = 1;
  // index into svgGraphs array
  const experimentTab = 2;
  // index into svgGraphs array

  let dataTable = [];
  // dataTable for diagrams
  const ingId = 0;
  // column indices for dataTable
  const Label = 1;
  const Prävalenz = 2;
  const Nachbarn = 3;
  const Knotengrad = 4;
  const Betweenness = 5;
  const Occurence = 6;
  const Mehrfachkanten = 7;
  const nam = 0;
  const excl = 1;
  const shared = 2;
  const sharedW = 3;
  // array holding values for exclusive/shared ingredients
  let rcpSiArr = [];
  let rcpSIArrSelect;
  let btnIds = [undefined, undefined, 'btnPrev', 'btnNeigh', 'btnDegr', 'btnBetw'];
  let btnState = [undefined, undefined, true, true, true, true];
  // button state for toggle button
  let btnGraph = 'first';
  const chartSpaces = [undefined, undefined, 'barChartPrev', 'barChartNeigh', 'barChartDegr', 'barChartBetween'];
  const histoSpaces = [undefined, undefined, 'histoPrev', 'histoNeigh', 'histoDegr', 'histoBetween'];
  const plotTitle = [undefined, undefined, 'Zutaten-Prävalenz', 'Anz Nachbarn', 'Knotengrad', 'Betweenness'];
  let chartAreas = [];
  let distinctMultiEdgesSorted;
  let ctRecipes;
  let prevStep;
  let ctIngredients;
  let avgNumberIngredientsPerRecipe;
  let ctEdges;
  let ctMultiEdges;
  let ctSingleEdges;
  let ctDistinctEdges;
  let ctDistinctMultiEdges;
  let sumWeightsMultiEdges;
  let avgCountNeighbors;
  let avgCountDistinctNeighbors;
  let avgWeightMultiEdges;
  let density;
  let entropy;
  let connectedComponents;

  function makeURL () {
    let myURL = new URL (document.URL);
    myColl = myURL.searchParams.get('coll');
  }

  // build graphs

  function fetchGraph () {
    // fetch combined jsnx and svg graphs in json format, build graphs
    let g_url = `${myColl}/combinedGraph.zip`;
    fetch(g_url, {
      cache: "no-store"
    })
      .then(function (response) {                     // 2) filter on 200 OK
        if (response.status === 200 || response.status === 0) {
          return Promise.resolve(response.blob());
        } else {
          return Promise.reject(new Error(response.statusText));
        }
      })
      .then(JSZip.loadAsync)                                   // 3) chain with the zip promise
      .then(function (zip) {
        return zip.file("combinedGraph.json").async("string"); // 4) chain with the text content promise
      })
      .then(function success(gText) {                // 5) display the result
        //console.log(text)
        // store graph.json locally
        sessionStorage.setItem("srcGraph", gText);
        let graph = JSON.parse(gText);
        document.title = graph.title;
        // build the jsnx graph
        jsnxGraphBuilder(graph);
        // build svg graph instances
        svgSpaces.forEach((space, i) => {
          svgGraphs[i] = Snap(space);
        });
        svgGraphBuilder(graph);
        clack();
        //dataTableBuilder();
        $(".rcpColl").text(myColl);
      }, function error(e) {
        alert("Sch ... ")
      });
  }

/*  function fetchGraph () {
    // fetch combined jsnx and svg graphs in json format, build graphs
    let g_url = `${myColl}/combinedGraph.json`;
    fetch(g_url, {
      cache: "no-store"
    }).then(function (response) {
        if (response.ok) return response.text();
    }).then(function (gText) {
      // store graph.json locally
      sessionStorage.setItem("srcGraph", gText);
      let graph = JSON.parse(gText);
      document.title = graph.title;
      // build the jsnx graph
      jsnxGraphBuilder(graph);
      // build svg graph instances
      svgSpaces.forEach((space, i) => {
        svgGraphs[i] = Snap(space);
      });
      svgGraphBuilder(graph);
      clack();
      dataTableBuilder();
      $(".rcpColl").text(myColl);
      fetchInterpretation();
    }). catch (function (err) {
      alert(err);
    });
  }*/

  function fetchSource () {
    let s_url = `${myColl}/source.html`;
    fetch(s_url, {cache: "no-store"})
      .then ((response) => {
        if (!response.ok) {
          throw new Error('When fetching source.html the network response was: ', response.status, response.statusText);
        }
        return response.text();
      })
      .then (function (htText){
        $('#quelleBody').html (htText);
        $(".rcpColl").text(myColl);
      })
      .catch ((err) => console.log ('Could not fetch source.html: ', err)
      );
  }

  function fetchInterpretation () {
    let s_url = `${myColl}/interpretation.html`;
    fetch(s_url, {cache: "no-store"})
      .then ((response) => {
        if (!response.ok) {
          throw new Error('When interpretation.html the network response was: ', response.status, response.statusText);
        }
        return response.text();
      })
      .then (function (htText){
        $('#interpretationBody').html (htText);
        $(".rcpColl").text(myColl);
        $('#' + 'maxPrev').html(Math.ceil(Math.max(...prev.values())));
        $('#' + 'maxNeigh').html(Math.max(...neigh.values()));
        $('#' + 'maxDegr').html(Math.max(...degr.values()));
        $(".maxBetw").html(Math.ceil(Math.max(...betw.values())));
        $('#' + 'zwiebelOcc').html(id2Occ.get ('zwiebel'));

        $('#' + 'oreganoBetw').html(betw.get ('oregano'));
        $('#' + 'rosmarinBetw').html(betw.get ('rosmarin'));
        $('#' + 'thymianBetw').html(betw.get ('thymian'));
        $('#' + 'zwiebelNeigh').html(neigh.get ('zwiebel'));
        $('#' + 'nelkenNeigh').html(neigh.get ('nelken'));
        $('#' + 'lorbeerNeigh').html(neigh.get ('lorbeer'));
        $('#' + 'lorbeerNeigh1').html(neigh.get ('lorbeer'));
        $('#' + 'zwiebelPrev').html(prev.get ('zwiebel'));
        $('#' + 'lorbeerPrev').html(prev.get ('lorbeer'));
        let ii;
        let nn;

        $('#' + 'kohlsuppeAnzZutaten').html(nn);
        $('#' + 'kohlsuppeAnzZutaten1').html(nn);
        $('#' + 'cntMiddle').html(countMiddle());
        $('#' + 'cntZero').html(countZero());
        $('#' + 'fracZeroMiddle').html(Math.round(100*countZero()/countMiddle())/100);
      })
      .catch ((err) => console.log ('Could not fetch interpretation.html: ', err)
      );
  }

  function countMiddle() {
    let cnt = 0;
    occ.forEach((v,k) => {if (v > 1) cnt++});
    return (cnt - 5);
  }

  function countZero() {
    let cnt = 0;
    occ.forEach((v,k) => {if (v === 1) cnt++});
    return (cnt);
  }

  function ingredientEntropy() {
    let sumOcc = dataTable.reduce((acc, cV) => acc + cV[Occurence], 0)
    return -dataTable.reduce((acc, cv) => {
      let x = cv[Occurence] / sumOcc;
      return acc + x * Math.log2(x);}, 0)
  }

  function capUnion (L,R) {
    let s, t;
    for (let e of R.edges(true)) {
      s=e[0];
      t=e[1];
      L.addEdge(s,t,{'id':e[2].id});
      if (L.adj.get(s).get(t).weight === undefined) {
        L.addEdge(s,t,{'weight':1})
      } else {
        L.adj.get(s).get(t).weight += 1
      }
    }
  }

  function buildGraphFromIngredientArray(coll, igdtListArr) {
    let Graph = new jsnx.Graph();
    igtList.forEach(function (igt) {
      if (igt.sub === coll || igt.sub === 'AB') {
        Graph.addNode(igt.id,{'sub':igt.sub,'label':igt.label,'class':igt.class,'occ':igt.occurs})
      }
    })

    let n;
    igdtListArr.forEach(function (igdtList) {
      n = igdtList.length;
      H = jsnx.completeGraph(n, new jsnx.Graph());
      let mapping = new Map();
      igdtList.forEach ((igt, idx) => mapping.set (idx, igt));
      jsnx.relabelNodes (H, mapping, false);
      H.edges(true).forEach (function (edge) {
        let id = [];
        id.push(edge[0]);
        id.push(edge[1]);
        id.sort (function (a, b) {
          return a.localeCompare(b, 'de-DE-1996')
        });
        H.adj.get(edge[0]).get(edge[1]).id = `${id[0]}--${id[1]}`;
      });
      capUnion (Graph,H);
      //G.addNodesFrom(H.nodes(true));
      //G.addEdgesFrom(H.edges(true));
    });
    return Graph
  }

  // building the jsnx graphs
  function jsnxGraphBuilder(graph) {
    igtList = graph.ingredients;
    rcpList = graph.recipes;
    igtList.forEach(function (igt) {
      G.addNode(igt.id,{'sub':igt.sub,'label':igt.label,'class':igt.class,'occ':igt.occurs})
    })
    // compute A and B  graphs
    const a_coll = graph.collections[0];
    const b_coll = graph.collections[1];
    const a_auth = Object.values(a_coll)[0].author;
    const b_auth = Object.values(b_coll)[0].author;
    const a_rcp = Object.values(a_coll)[0].recipes;
    const b_rcp = Object.values(b_coll)[0].recipes;
    let xx;
    let A_rcp = [];
    a_rcp.forEach((rcp) => {
      xx = rcpList.filter(obj => obj.recipeName===rcp);
      A_rcp.push (xx[0].ingredients)
    })
    A = buildGraphFromIngredientArray('A', A_rcp);
    let B_rcp = [];
    b_rcp.forEach((rcp) => {
      xx = rcpList.filter(obj => obj.recipeName===rcp);
      B_rcp.push (xx[0].ingredients)
    })
    B = buildGraphFromIngredientArray('B', B_rcp);

    // build union graph G
    capUnion (G,A);
    capUnion (G,B);

    // build intersection graph
    function cmpEdgeIds (el1,el2) {
      return (el1[2].id === el2[2].id)
    }
    let xxx = _.intersectionWith(A.edges(true),B.edges(true),cmpEdgeIds);
    let yyy = _.intersectionWith(A.nodes(true),B.nodes(true),_.isEqual);
    xxx.forEach((item) => {
      item[2].weight = (G.get(item[0]).get(item[1]).weight)
    })
    Intersect.addEdgesFrom(xxx);
    Intersect.addNodesFrom(yyy);

    // compute number of recipes
    ctRecipes = rcpList.length;
    prevStep = 100 / ctRecipes;
    // compute average number of ingredients per recipe
    let sumIgtPerRecipe = 0;
    rcpList.forEach(function (recipe) {
      sumIgtPerRecipe += recipe.ingredients.length;
    });
    avgNumberIngredientsPerRecipe = Math.round(100 * sumIgtPerRecipe / ctRecipes) / 100;
    // build datalist for recipe dropdown menu
    rcpList.forEach (function (recipe) {
      rcpNameList.push(recipe.recipeName);
      $('#' + 'rcpNames').append(`<option value = "${recipe.recipeName}"/>`)
    });
    // build datalist for ingredient dropdown menu
    let i;
    for (i = 0; i < igtList.length; i++) {
      $('#' + 'igtNames').append(`<option value = "${igtList[i].label}"/>`)
    }
    // helpers for ui
    label2Id.clear();
    for (let ingredient of graph.ingredients) {
      label2Id.set (ingredient.label, ingredient.id)
    }

    id2Label.clear();
    for (let ingredient of graph.ingredients) {
      id2Label.set (ingredient.id, ingredient.label)
    }
    id2Occ.clear();
    for (let ingredient of graph.ingredients) {
      id2Occ.set (ingredient.id, parseInt(ingredient.occurs))
    }
    // node properties
    label.clear();
    for (let ingredient of graph.ingredients) {
      label.set (ingredient.id, ingredient.label)
    }
    prev.clear();
    occ.clear();
    for (let ingredient of graph.ingredients) {
      occ.set (ingredient.id, parseInt(ingredient.occurs));
      prev.set (ingredient.id, Math.round(100000 * parseInt(ingredient.occurs) / ctRecipes) / 1000);
    }
    degr.clear();
    degr = jsnx.degree(G);
    neigh.clear();
    for (let ingredient of graph.ingredients) {
        neigh.set (ingredient.id, G.neighbors(ingredient.id).length)
    }
    betw = jsnx.betweennessCentrality(G, {
        'normalized': false
    });
    betw.forEach((v, k) => betw.set (k, Math.round(1000 * v) / 1000));
    // all other sample values are computed here
    computeSampleInfo();
  }

  function svgGraphBuilder(g) {
    svgGraphs.forEach((graph) => {
      let parent = graph; // svg graph instance
      let child = parent;
      let element = g.svg; // svg element in json file
      let kellerObj = [];
      let kellerPar = [];
      kellerObj.push(element);
      kellerPar.push(parent);
      while ((element = kellerObj.pop()) !== undefined) {
        parent = kellerPar.pop();
        for (let[key, value] of Object.entries(element)) {
          if ((typeof (value) === "object") && (Array.isArray(value) === false)) {
            child = graph.el(key);
            parent.append(child);
            kellerObj.push(value);
            kellerPar.push(child);
          } else if ((typeof (value) !== "object") && (Array.isArray(value) === false)) {
            if (key === "#text-content") {
              parent.node.innerHTML = value;
            } else if (key === "title") {
              child = graph.el(key);
              parent.append(child);
              child.node.innerHTML = value;
              } else {
                let att = key.substr((key.indexOf('#') + 1), key.length);
                /*if (key = "#viewBox") {
                  console.log (graph.getBBox().vb)
                  value = graph.getBBox().vb
                }*/
                parent.attr({[att]: value});
              }
          }
          if (Array.isArray(value) === true) {
            for (let[k, v] of Object.entries(value)) {
              child = graph.el(key);
              parent.append(child);
              kellerObj.push(v);
              kellerPar.push(child);
            }
          }
        }
      }
    })
    svgGraphs.forEach((graph) => {
      vB = graph.getBBox().vb
      BBh = graph.getBBox().h
      BBw = graph.getBBox().w
    })
  }

  function clack() {
    // set node font-size
    // attach click handlers to svg ingredient nodes and set their title elements
    svgGraphs.forEach((graph, i) => {
      graph.attr ({viewBox: vB})
      graph.selectAll("[class='node']").forEach(function (nd) {
        nd.attr("cursor", "pointer");
        let igtID = nd.attr("id");
        let p = prev.get(igtID);
        let d = degr.get(igtID);
        let b = betw.get(igtID);
        let n = neigh.get(igtID);
        let l = id2Label.get(igtID);
        nd.select("title").node.innerHTML = `${l}\nPrävalenz: ${p}%\nAnz. Nachbarn: ${n}\nKnotengrad: ${d}\nBetweenness: ${b}`;
        console.log (nd.outerSVG());

        nd.node.onclick = function () {
          console.log (nd)
          showIngredient(nd.attr('id'), graph)
        };

        if (i === experimentTab) {
          nd.node.oncontextmenu = function (event) {
            event.preventDefault();
            remove(nd.attr('id'))
          }
        } else {
          nd.node.oncontextmenu = function (event) {
            event.preventDefault();
            let ingdt = nd.attr('id');
            let k, l, m = 0;
            let occ = id2Occ.get (ingdt);
            let rcpByIgt =[];
            overRcp:
            for (k = 0; k < rcpList.length; k++) {
              overRcpIgt:
              for (l = 0; l < rcpList[k].ingredients.length; l++) {
                if (rcpList[k].ingredients[l] === ingdt) {
                  rcpByIgt.push(rcpList[k].recipeName);
                  m++;
                  if (m == occ) break overRcp;
                  break;
                }
              }
            }
            $('#' + 'rcpByIgtList').empty();
            rcpByIgt.forEach(
            rcp => $('#' + 'rcpByIgtList').append(`<button type="button" class="list-group-item list-group-item-action m-0 p-0"
                    onclick="showRecipeByName(svgGraphs[konstruktionTab],'${rcp}')">${rcp}</button>`)
            );
          }
        }
        /*igtID = nd.attr("id");
        p = prev.get(igtID)
        d = degr.get(igtID);
        b = betw.get(igtID);
        n = neigh.get(igtID);
        l = id2Label.get(igtID);
        nd.select("title").node.innerHTML = `${l}\nPrävalenz: ${p}%\nAnz. Nachbarn: ${n}\nKnotengrad: ${d}\nBetweenness: ${b}`;*/
      })
    });
  }

  function computeSampleInfo () {
    ctIngredients = G.numberOfNodes();
    ctEdges = jsnx.edges(G).length;
    let edgeIds = jsnx.getEdgeAttributes(G, 'id');
    let edgeIdArr = Array.from (edgeIds.values());
    let distinctEdges = edgeIdArr.reduce(function (collector, edge) {
      if (edge in collector) {
        collector[edge]++;
      } else {
        collector[edge] = 1;
      }
      return collector;
    }, {
    });

    let entries = Object.entries(distinctEdges);
    let edges = [];
    for (let e_id of entries) {
      let edge = [e_id[0].substr(0, e_id[0].indexOf('-')), e_id[0].substr(e_id[0].indexOf('-') + 2), {id : e_id[0], weight : e_id[1]} ]
      let idW = [e_id[0], e_id[1]];
      edges.push (edge);
      id2Weight.push (idW);
    }
    // array of [edge id, edge weight] entries, sorted by weight
    id2Weight.sort(function(a,b){
      return a[1]-b[1];
    })
    //undirected graph with edge weights
    G1.addEdgesFrom (edges);
    for (let e of G1.edges(true)) {
      let s,t;
      if (e[0].localeCompare(e[1], 'de-DE-1996') === -1) {
        s = e[0];
        t = e[1];
      } else {
        s = e[1];
        t = e[0];
      }
    }

    ctDistinctEdges = entries.length;
    avgCountNeighbors = Math.round(200 * ctEdges / ctIngredients) / 100;
    avgCountDistinctNeighbors = Math.round(200 * ctDistinctEdges / ctIngredients) / 100;
    density = Math.round((2000 * ctDistinctEdges) / (ctIngredients * (ctIngredients - 1)))/10 ;
    distinctMultiEdgesSorted = entries.sort((a, b) => b[1] - a[1]);
    ctMultiEdges = 0;
    ctDistinctMultiEdges = 0;
    distinctMultiEdgesSorted.forEach ((el) => {
      if (el[1] > 1) ctMultiEdges += el[1]
    });
    distinctMultiEdgesSorted.forEach ((el) => {
      if (el[1] > 1) ctDistinctMultiEdges++
    });
    connectedComponents = connComp();
    ctSingleEdges = ctDistinctEdges - ctDistinctMultiEdges;
    sumWeightsMultiEdges = ctEdges - ctSingleEdges;
    avgWeightMultiEdges = Math.round(100*sumWeightsMultiEdges/ctDistinctMultiEdges)/100;
  }

  function dataTableBuilder() {
    betw.forEach(function (val, key) {
      dataTable.push([key, label.get(key), prev.get(key), neigh.get(key), degr.get(key), val, occ.get(key)]);
    });
  }

  // svg graph functions for user interface
  function handleFog(s) {
    // handle fog over svg canvas
    // remove fog from previous call to show(); install fresh fog
    // console.log ('foggy', s.select("#foggy"));
    if (s.select("#foggy") !== null) {
      s.select("#foggy").remove();
      fog = s.g();
      fog.attr({id: 'foggy'});
    } else {
      fog = s.g();
      fog.attr({id: 'foggy'});
    }
    //console.log (vB)

    fog.rect(0, 0, BBw+200, BBh+100).attr({fill: 'white', fillOpacity: 0.85, cursor: 'pointer'});
    fog.click(function () {
      fog.remove();
      fog = null;
    });
  }

  function showIngredient(ingredient, s) {
    // ingredient node click handler
    // left click: show node and its neighbours
    fog = s.g();
    handleFog(s);
    let el = s.select('#'.concat(ingredient));
    let elClone = el.clone();
    let elCloneId = el.attr("id").concat("-clone");
    elClone.attr({
        "id": elCloneId
    });
    fog.append(elClone);
    // right click: remove shown node
   /* elClone.node.oncontextmenu = function (event) {
      event.preventDefault();
      fog.remove();
      fog = null;
      let elId = elCloneId.substr(0, elCloneId.indexOf('-'));
      // remove node from all svg graph instances and jsnx graph
      remove(elId, s);
    };*/
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
    keller.forEach(function (el) {
        fog.append(el);
    })
  }

  function showIngredientByName(s) {
    let igtName = document.getElementById("igtNameInputField").value;
    let igt = label2Id.get (igtName);
    showIngredient(igt, s);
  }

  function showIngredientsByCat(cat, s) {
    // click handler for category legend entries
    fog = s.g();
    handleFog(s);
    let col = window.getComputedStyle(cat, null).getPropertyValue("background-color");
    s.selectAll("[class='node']").forEach(function (el) {
      if (el.select('ellipse').attr('fill') === col) {
        let elClone = el.clone();
        let elCloneId = el.attr("id").concat("-clone");
        elClone.attr({
          "id": elCloneId
        });
        fog.append(elClone);
        // right click: remove shown node
        elClone.node.oncontextmenu = function (event) {
          event.preventDefault();
          fog.remove();
          fog = null;
          let elId = elCloneId.substr(0, elCloneId.indexOf('-'));
          //remove node from both svg and jsnx
          remove(elId, s);
        }
      }
    })
  }

  function countIngredientsByCat() {
    let cols = $("#farblegendeBody table td div");
    let arr = jQuery.makeArray(cols);
    let ellis = jQuery.makeArray($("#graph0 ellipse"));
    let classes = [];
    for (let elli of ellis) {
      classes.push(elli.attributes.getNamedItem('class').value);
    }
    const occurrences = classes.reduce(function (acc, curr) {
      return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
    }, {});
    for (const [key, value] of Object.entries(occurrences)) {
      //console.log(`${cat2Text.get(key)}: ${value}`);
      let cellId = 'cnt'+key;
      $('#' + cellId).html(value);
    }
  }

  function showIngredientsByPrev(prevClass, s) {
    // click handler for prevalence legend entries
    // fog = s.g();
    handleFog(s);
    s.selectAll("[class='node']").forEach(function (el) {
      if (el.select('ellipse').attr('class') === prevClass) {
        let elClone = el.clone();
        let elCloneId = el.attr("id").concat("-clone");
        elClone.attr({"id": elCloneId});
        fog.append(elClone);
        // right click: remove shown node
        /*elClone.node.oncontextmenu = function (event) {
          event.preventDefault();
          fog.remove();
          fog = null;
          let elId = elCloneId.substr(0, elCloneId.indexOf('-'));
          //remove node from both svg and jsnx
          remove(elId, s);
        }*/
      }
    })
  }

  function showRecipeByName(s, rcpName) {
    // show recipe by recipe name
    fog = s.g();
    handleFog(s);
    if (arguments.length == 1) {
        rcpName = document.getElementById("rcpNameInputField").value;
    }
    let R = new jsnx.Graph();
    let i;
    for (i = 0; i < rcpList.length; i++) {
      if (rcpList[i].recipeName === rcpName) {
        let n = rcpList[i].ingredients.length;
        R = jsnx.completeGraph(n, R);
        let mapping = new Map();
        rcpList[i].ingredients.forEach((igt, idx) => mapping.set (idx, igt));
        jsnx.relabelNodes(R, mapping, false);
        R.edges(true).forEach(function (edge) {
            let idArr = [];
            idArr.push(edge[0]);
            idArr.push(edge[1]);
            idArr.sort(function (a, b) {
                return a.localeCompare(b, 'de-DE-1996')
            });
            R.adj.get(edge[0]).get(edge[1]).id = `${idArr[0]}--${idArr[1]}`;
        });
        R.edges(true).forEach(function (edge) {
            let edgeToFind = R.adj.get (edge[0]).get (edge[1]).id;
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

  function showSubgraph (s, SG) {
    //fog = s.g();
    handleFog(s);
    let el;
    switch (SG) {
      case 'A':
        el = s.use().attr('href', '#AEdges');
        fog.append(el);
        el = s.use().attr('href', '#intersectEdges');
        fog.append(el);
        el = s.use().attr('href', '#ANodes');
        fog.append(el);
        el = s.use().attr('href', '#intersectNodes');
        fog.append(el);
        break;
      case 'B':
        el = s.use().attr('href', '#BEdges');
        fog.append(el);
        el = s.use().attr('href', '#intersectEdges');
        fog.append(el);
        el = s.use().attr('href', '#BNodes');
        fog.append(el);
        el = s.use().attr('href', '#intersectNodes');
        fog.append(el);
        break;
      case('Intersect'):
        el = s.use().attr('href', '#intersectEdges');
        fog.append(el);
        el = s.use().attr('href', '#intersectNodes');
        fog.append(el);
        break;
    }

    /*SG.edges(true).forEach(function (edge) {
      let edgeToFind = SG.adj.get (edge[0]).get (edge[1]).id;
      let el = s.select('#'.concat(edgeToFind));
      fog.append(el.clone());
    });
    SG.nodes(true).forEach (function (nd) {
      let el = s.select('#'.concat(nd[0]));
      fog.append(el.clone());
    });*/
  }

  function clustCoeff() {
    flyInClCo('clCoChartArea', 'barChartClusteringCoefficients');
  }

  // simulate button click by pressing return key
  document.getElementById("oBPrev").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("btnPrevBounds").click();
    }
  });
  document.getElementById("oBNeigh").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("btnNeighBounds").click();
    }
  });
  document.getElementById("oBDegr").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("btnDegrBounds").click();
    }
  });
  document.getElementById("oBBetw").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("btnBetwBounds").click();
    }
  });

  function showByData(s, dataIdx) {
    // click handler for input boxes: show nodes by data
    let ub;
    let ob;
    switch (dataIdx) {
      case Prävalenz:
        ub = parseFloat(document.getElementById("uBPrev").value);
        ob = parseFloat(document.getElementById("oBPrev").value);
        break;
      case Nachbarn:
        ub = parseFloat(document.getElementById("uBNeigh").value);
        ob = parseFloat(document.getElementById("oBNeigh").value);
        break;
      case Knotengrad:
        ub = parseFloat(document.getElementById("uBDegr").value);
        ob = parseFloat(document.getElementById("oBDegr").value);
        break;
      case Betweenness:
        ub = parseFloat(document.getElementById("uBBetw").value);
        ob = parseFloat(document.getElementById("oBBetw").value);
        break;
    }
    showNodesBetwBounds(s,dataIdx,ub,ob);
  }

  function showBigFive (by) {
    sortByCol(dataTable, -1, by, Label);
    let upper = dataTable [0][by] + 1;
    let lower = dataTable [4][by];
    showNodesBetwBounds(svgGraphs[konstruktionTab],by,lower,upper);
  }

  function showMittelerde () {
    sortByCol(dataTable, -1, Occurence, Label);
    let upper = dataTable [4][Occurence];
    let lower = 2;
    showNodesBetwBounds(svgGraphs[konstruktionTab],Occurence,lower,upper);
  }

  function showNullknoten () {
    let upper = 2;
    let lower = 0;
    showNodesBetwBounds(svgGraphs[konstruktionTab],Occurence,lower,upper);
  }

  function showNodesBetwBounds (s,dataIdx,ub,ob) {
    if (ub > ob) {
      alert("Unterer Wert größer als oberer Wert!");
      return;
    }
    fog = s.g();
    handleFog(s);
    let graphDataMap = new Map();
    switch (dataIdx) {
      case Prävalenz:
        graphDataMap = prev;
        break;
      case Nachbarn:
        graphDataMap = neigh;
        break;
      case Knotengrad:
        graphDataMap = degr;
        break;
      case Betweenness:
        graphDataMap = betw;
        break;
      case Occurence:
        graphDataMap = occ;
        break;
    }
    graphDataMap.forEach(function (val, key) {
      if ((val >= ub) && (val < ob)) {
        let el = s.select('#'.concat(key));
        let elClone = el.clone();
        let elCloneId = el.attr("id").concat("-clone");
        elClone.attr({"id": elCloneId});
        fog.append(elClone);
        // right click handler to remove shown node
        /*elClone.node.oncontextmenu = function (event) {
          event.preventDefault();
          fog.remove();
          fog = null;
          let elId = elCloneId.substr(0, elCloneId.indexOf('-'));
          remove(elId);
        }*/
      }
    })
  }

  // remove, restore, reset, recompute functions
  function remove(ingredient) {
    // remove ingredient node and all connected edges
    // remove from svg graph instances
    /*svgGraphs.forEach((graph, i) => {
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
    let jsnxEdges = jsnx.edges(G, ingredient);
    for (let jsnxEdge of jsnxEdges) {
      jsnxHist.push(jsnxEdge);
    }
    // push node on stack
    let jsnxNode = [
      ingredient,
      G.node.get (ingredient)
    ];
    let deg = jsnx.degree(G).get (ingredient);
    jsnxNode.unshift({
      "degree": deg
    });
    jsnxNode.unshift({
      "class": "node"
    });
    jsnxHist.push(jsnxNode);
    // remove node and all connected edges
    G.removeNode(ingredient);*/
  }

  function graphControl() {
    if (btnGraph === 'first') {
      btnGraph = 'i';
      prevGraphBuilder();
    }
  }

  function prevGraphBuilder() {
    // build prevalence graph from ingredient graph
    Gclone = $('#graph0').clone();
    let prevArr = [];
    dataTable.forEach(entry => prevArr.push (entry[2]))
    let q14 = ss.quantile (prevArr, 0.25);
    let q12 = ss.quantile (prevArr, 0.5);
    let q34 = ss.quantile (prevArr, 0.75);
    console.log ('q14: ', q14, 'q12: ', q12, 'q34: ', q34, 'total: ', prevArr.length)
    svgGraphs[konstruktionTab].selectAll("g").forEach(function (node) {
      if (node.attr('class') === 'node') {
        let ndId;
        let val;
        ndId = node.attr('id');
        val = prev.get (ndId);
        if (val <= q14) {
          node.select('ellipse').attr({class : 'prev1'});} else {
        if (val <= q12) {
          node.select('ellipse').attr({class : 'prev2'});} else {
        if (val <= q34) {
          node.select('ellipse').attr({class : 'prev3'});} else {
        node.select('ellipse').attr({class : 'prev4'});
            }
          }
        }
      }
    })
  }

  function toggleGraph() {
    let s = svgGraphs[konstruktionTab];
    if (s.select("#foggy") !== null)
      s.select("#foggy").remove();
    if (btnGraph === 'i') {
      /*$('#graph0').detach();
      Gclone.appendTo('#graphSpace01');
      clack();*/
      resetGraph();
      $('#' + 'btnPrevGraph').html('Prävalenzgraph');
      btnGraph = 'p';
      } else {
        prevGraphBuilder();
        clack();
        $('#' + 'btnPrevGraph').html('Zutatengraph');
        btnGraph = 'i';
      }
  }

  function restoreGraph() {
    svgGraphs.forEach((graph, i) => {
      if (i === experimentTab) {
        let pre = graph.select(".edge:nth-of-type(1)");
        let svgLen = svgHist.length;
        for (i = 0; i < svgLen; i++) {
          let elPopped = svgHist.pop();
          if (elPopped.attr("class") === "edge")
          pre.after(elPopped); else if (elPopped.attr("class") === "node") {
            graph.append(elPopped);
            break;
          }
        }
      }
    });
    let jsnxAtom = jsnxHist.pop();
    if (jsnxAtom[0]. class === "node") {
      jsnxAtom.shift();
      let degCount = jsnxAtom.shift();
      G.addNode(jsnxAtom[0], jsnxAtom[1]);
      for (let k = 0; k < degCount.degree; k++) {
        jsnxAtom = jsnxHist.pop();
        G.addEdge(jsnxAtom[0], jsnxAtom[1]);
      }
    } else {
      alert ("Element popped off stack is not of class: node")
    }
  }

  function resetGraph() {
    G = new jsnx.MultiGraph();
    svgGraphs.forEach(graph => {
      graph.clear()
    });
    if (sessionStorage.getItem("srcGraph")) {
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
    neigh.clear();
    for (let node of G.nodes()) {
      neigh. set (node[0], G.neighbors(node[0]).length);
    }
    betw.clear();
    betw = jsnx.betweennessCentrality(G, {
      'normalized': false
    });
    betw.forEach((v, k) => betw.set (k, Math.round(10 * v) / 10));
    degr.clear();
    degr = jsnx.degree(G);
    svgGraphs.forEach((s) => {
      s.selectAll("[class='node']").forEach(function (nd) {
        let igtID = nd.attr("id");
        let p = prev. get (igtID);
        let d = degr. get (igtID);
        let b = betw. get (igtID);
        let n = neigh. get (igtID);
        nd.select("title").node.innerHTML = `Prävalenz: ${p}\nAnz.Nachbarn: ${n}\nKnotengrad: ${d} \nBetweenness: ${b}`;
      })
    })
  }

  // charting functions

  function byValue(col) {
    sortByLabel(dataTable);
    barChart(chartSpaces[col], col);
    $('#' + btnIds[col]).html('Nach Wert sortieren');
    btnState[col] = false;
  }

  function byName(col) {
    sortByCol(dataTable, -1, col, Label);
    barChart(chartSpaces[col], col);
    $('#' + btnIds[col]).html('Nach Namen sortieren');
    btnState[col] = true;
  }

  function toggleBtn(col) {
    btnState[col] ? byValue(col): byName(col);
  }

  function flyIn (chartAreaId) {
    chartAreas.forEach (area => flyOut(area));
    chartAreas.push(chartAreaId);
    $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");
  }

  function flyInBar(chartAreaId,chartSpace,col) {
    flyIn (chartAreaId);
    sortByCol(dataTable, -1, col, Label);
    barChart(chartSpace,col);
  }

  function setSISelect (ESselector) {
    rcpSIArrSelect = ESselector;
    return rcpSIArrSelect
  }

  function getSISelect () {
    return rcpSIArrSelect
  }

  function createEStable () {
    rcpSiArr = [];
    for (let recipe of rcpList) {
      let igtOcc;
      let ctEI = 0;
      let ctSI = 0;
      let ctSIw = 0;
      recipe.ingredients.forEach (function (igt) {
        igtOcc = id2Occ.get (igt);
        if (igtOcc > 1) {
          ctSI++;
          ctSIw += igtOcc;
        } else {
          ctEI++;
        }
      });
      let siArr = [];
      siArr.push (recipe.recipeName, ctEI, ctSI, ctSIw);
      rcpSiArr.push(siArr);
    }
  }

  function showESData(chartSpace,selectData) {
    let yVal  = rcpSiArr.map(tuple => tuple[0]);
    let EI = rcpSiArr.map(tuple => tuple[1]);
    let SI = rcpSiArr.map(tuple => tuple[2]);
    let SIw = rcpSiArr.map(tuple => tuple[3]/10);
    let maxEI = Math.max (...EI);
    maxEI = Math.ceil(maxEI/10) * 10;
    let spacer = rcpSiArr.map(tuple => maxEI - tuple[1])

    let trace1 = {
      x: spacer,
      y: yVal,
      type: 'bar',
      showlegend: false,
      text: EI.map(String),
      textposition: 'outside',
      hoverinfo: 'none',
      orientation: 'h',
      marker: {
        color: 'rgba(1,1,1,0.0)',
      },
      textfont: {
        color: 'rgb(128,128,128)'
      }
    };
    let trace2 = {
      x: EI,
      y: yVal,
      type: 'bar',
      name: 'exclusive',
      hoverinfo: 'none',
      orientation: 'h',
      marker: {
        color: 'rgb(66,114,138)',
      },
    };
    let trace3 = {
      x: SI,
      y: yVal,
      type: 'bar',
      name: 'shared',
      text: SI.map(String),
      textposition: 'outside',
      hoverinfo: 'none',
      orientation: 'h',
      marker: {
        color: 'rgb(138,66,114)',
      },
      textfont: {
        color: 'rgb(128,128,128)'
      }
    };
    let trace4 = {
      x: SIw,
      y: yVal,
      type: 'bar',
      name: 'shared weighted',
      text: SIw.map(String),
      textposition: 'outside',
      hoverinfo: 'none',
      orientation: 'h',
      marker: {
        color: 'rgb(138,66,114)',
      },
      textfont: {
        color: 'rgb(128,128,128)'
      }
    };

    let data = [];
    if (selectData === 'SI') {
      data = [trace1,trace2,trace3];
    }
    else if (selectData === 'SIwei') {
      data = [trace1,trace2,trace4];
    }
    let layout = {
      barmode: 'stack',
      xaxis: {
        side: 'top',
        zerolinecolor: 'rgba(1,1,1,0.0)',
        showticklabels: false
      },
      yaxis: {
        autorange: "reversed", automargin: true, zerolinecolor: 'rgba(1,1,1,0.0)'
      },
      font: {
        color: 'rgb(128,128,128)'
      },
      margin: {
        t: 16
      }
    };
    Plotly.newPlot(chartSpace, data, layout);
  }

  function visuESData (chartAreaId, chartSpace, selectData) {
    $('#barChartSharedIngredients').height(ctRecipes*20)
    setSISelect (selectData);
    flyIn (chartAreaId);
    showESData (chartSpace,selectData)
  }

  function visuESDataSort (chartSpace, col, l2sort, dir) {
    let selectData = getSISelect ();
    if (col===shared && selectData==='SIwei') {
      col = sharedW;
    }
    if (l2sort===shared && selectData==='SIwei') {
      l2sort = sharedW;
    }
    sortByCol(rcpSiArr, dir, col, l2sort);
    showESData (chartSpace,selectData)
  }

  // clustering coefficients

  function flyInClCo (chartAreaId, chartSpace) {
    chartAreas.forEach (area => flyOut(area));
    chartAreas.push(chartAreaId);
    $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");
    let clCo = jsnx.clustering(G1,undefined,'weight');
    let clCoArr = Array.from(clCo);
    sortByCol(clCoArr, -1, 1, 0);
    let xVal = [];
    let yVal = [];
    clCoArr.forEach(function(el){
      yVal.push (el[0]);
      xVal.push (el[1]);
    })
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
        color: 'rgb(128,128,128)'
      }
    };
    let data = [trace1];
    let layout = {
      xaxis: {
        side: 'top'
      },
      yaxis: {
        autorange: "reversed", automargin: true
      },
      font: {
        color: 'rgb(128,128,128)'
      },
      margin: {
        t: 16
      }
    };
    Plotly.newPlot(chartSpace, data, layout);
  }

  function flyOut(chartAreaId) {
    chartAreas.pop();
    $('#' + chartAreaId).toggleClass('stretchRight stretchLeft').css("visibility", "visible");
  }

  function flyInScatter(chartAreaId, chartSpace) {
      flyIn (chartAreaId);
      let pre = [];
      let nei = [];
      let deg = [];
      let bet = [];
      let textVal = [];
      dataTable.forEach(function (el, i) {
          pre[i] = el[Prävalenz];
          nei[i] = el[Nachbarn];
          deg[i] = el[Knotengrad];
          bet[i] = el[Betweenness];
          textVal[i] = el[Label];
      });
      let trace1 = {
          x: nei,
          y: pre,
          type: 'scatter',
          text: textVal,
          mode: 'markers',
          hoverinfo: 'text+x+y',
          marker: {
              color: 'rgb(66,114,138)'
          }
      };
      let trace2 = {
          x: nei,
          y: deg,
          xaxis: 'x2',
          yaxis: 'y2',
          type: 'scatter',
          text: textVal,
          mode: 'markers',
          hoverinfo: 'text+x+y',
          marker: {
              color: 'rgb(66,114,138)'
          }
      };
      let trace3 = {
          x: nei,
          y: bet,
          xaxis: 'x3',
          yaxis: 'y3',
          type: 'scatter',
          text: textVal,
          mode: 'markers',
          hoverinfo: 'text+x+y',
          marker: {
              color: 'rgb(66,114,138)'
          }
      };
      let trace4 = {
          x: pre,
          y: deg,
          xaxis: 'x4',
          yaxis: 'y4',
          type: 'scatter',
          text: textVal,
          mode: 'markers',
          hoverinfo: 'text+x+y',
          marker: {
              color: 'rgb(66,114,138)'
          }
      };
      let trace5 = {
          x: pre,
          y: bet,
          xaxis: 'x5',
          yaxis: 'y5',
          type: 'scatter',
          text: textVal,
          mode: 'markers',
          hoverinfo: 'text+x+y',
          marker: {
              color: 'rgb(66,114,138)'
          }
      };
      let trace6 = {
          x: deg,
          y: bet,
          xaxis: 'x6',
          yaxis: 'y6',
          type: 'scatter',
          text: textVal,
          mode: 'markers',
          hoverinfo: 'text+x+y',
          marker: {
              color: 'rgb(66,114,138)'
          }
      };
      let data =[trace1, trace2, trace3, trace4, trace5, trace6];
      let layout = {
          grid: {
              rows: 2, columns: 3, pattern: 'independent'
          },
          yaxis: {
              automargin: true
          },
          font: {
              color: 'rgb(128,128,128)'
          },
          margin: {
              t: 16
          },
          showlegend: false,
          hoverlabel: {
              bgcolor: 'white', font: {
                  color: 'black'
              }
          },
          annotations:[ {
            xref: 'paper', yref: 'paper', x: 0.05, xanchor: 'left', y: 1, yanchor: 'bottom',
            text: 'Prävalenz über #Nachbarn', showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.1, xanchor: 'left', y: 0.95, yanchor: 'bottom',
            text: `r=${ss.sampleCorrelation(pre, nei).toFixed(2)}`, showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.4, xanchor: 'left', y: 1, yanchor: 'bottom',
            text: 'Knotengrad über #Nachbarn', showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.45, xanchor: 'left', y: 0.95, yanchor: 'bottom',
            text: `r=${ss.sampleCorrelation(deg, nei).toFixed(2)}`, showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.75, xanchor: 'left', y: 1, yanchor: 'bottom',
            text: 'Betweenness über #Nachbarn', showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.8, xanchor: 'left', y: 0.95, yanchor: 'bottom',
            text: `r=${ss.sampleCorrelation(bet, nei).toFixed(2)}`, showarrow: false
          },
            {
            xref: 'paper', yref: 'paper', x: 0.05, xanchor: 'left', y: 0.4, yanchor: 'bottom',
            text: 'Knotengrad über Prävalenz', showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.1, xanchor: 'left', y: 0.35, yanchor: 'bottom',
            text: `r=${ss.sampleCorrelation(deg, pre).toFixed(2)}`, showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.4, xanchor: 'left', y: 0.4, yanchor: 'bottom',
            text: 'Betweenness über Prävalenz', showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.45, xanchor: 'left', y: 0.35, yanchor: 'bottom',
            text: `r=${ss.sampleCorrelation(bet, pre).toFixed(2)}`, showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.75, xanchor: 'left', y: 0.4, yanchor: 'bottom',
            text: 'Betweenness über Knotengrad', showarrow: false
          }, {
            xref: 'paper', yref: 'paper', x: 0.8, xanchor: 'left', y: 0.35, yanchor: 'bottom',
            text: `r=${ss.sampleCorrelation(bet, deg).toFixed(2)}`, showarrow: false
          },]
      };
      Plotly.newPlot(chartSpace, data, layout);
      console.log ('Korr Prävalenz   - #Nachbarn:  ',ss.sampleCorrelation(pre, nei).toFixed(2));
      console.log ('Korr Knotengrad  - #Nachbarn:  ',ss.sampleCorrelation(deg, nei).toFixed(2));
      console.log ('Korr Betweenness - #Nachbarn:  ',ss.sampleCorrelation(bet, nei).toFixed(2));
      console.log ('Korr Knotengrad  - Prävalenz:  ',ss.sampleCorrelation(deg, pre).toFixed(2));
      console.log ('Korr Betweenness - Prävalenz:  ',ss.sampleCorrelation(bet, pre).toFixed(2));
      console.log ('Korr Betweenness - Knotengrad: ',ss.sampleCorrelation(bet, deg).toFixed(2));
  }

  function flyInFacts(chartAreaId) {
    chartAreas.forEach (area => flyOut(area));
    chartAreas.push(chartAreaId);
    countIngredientsByCat();
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
    $('#' + 'density').html(`${density} %`);
    $('#' + 'entropy').html(Math.round(10000*ingredientEntropy())/10000 + ' bits');
    $('#' + 'ctComponents').html(connectedComponents);
    $('#' + 'ctSingleEdges').html(ctSingleEdges);
    $('#' + 'sumWeightsMultiEdges').html(sumWeightsMultiEdges);
    $('#' + 'avgWeightMultiEdges').html(avgWeightMultiEdges);
  }

  function flyInMultipleEdgesHeatmap(chartAreaId, chartSpace) {
    chartAreas.forEach (area => flyOut(area));
    chartAreas.push(chartAreaId);
    $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");
    let xLab = [];
    let yLab = [];
    let zVal = [];
    let i;
    for (i = 0; i < 150; i++) {
      let xx = distinctMultiEdgesSorted[i];
      let x = xx[0].substr(0, xx[0].indexOf('-'));
      xLab.push(id2Label.get (x));
      let y = xx[0].substr(xx[0].indexOf('-') + 2);
      yLab.push(id2Label.get (y));
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
      textfont: {
        color: 'rgb(128,128,128)'
      }
    };
    let layout = {
      xaxis: {
        side: 'top'
      },
      yaxis: {
        autorange: "reversed", automargin: true
      },
      font: {
        color: 'rgb(128,128,128)'
      }
    };
    let data =[trace1];
    Plotly.newPlot(chartSpace, data, layout);
  }

  function flyInMultipleEdges(chartAreaId, chartSpace) {
    chartAreas.forEach (area => flyOut(area));
    chartAreas.push(chartAreaId);
    $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");
    let xVal = [];
    let yVal = [];
    let i;
    for (i = 0; i < 200; i++) {
      let x = distinctMultiEdgesSorted[i];
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
      xaxis: {
        side: 'top'
      },
      yaxis: {
        autorange: "reversed", automargin: true
      },
      font: {
        color: 'rgb(128,128,128)'
      },
      margin: {
        t: 16
      }
    };
    Plotly.newPlot(chartSpace, data, layout);
  }

  function barChart(chartSpace, col) {
    let xx = [];
    let yy = [];
    let xVal = [];
    let yVal = [];
    dataTable.forEach(function (el, i) {
      xx[i] = el[col];
      yy[i] = el[Label];
    });
    xVal = xx.slice(0,200);
    yVal = yy.slice(0,200);
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
        color: 'rgb(128,128,128)'
      }
    };
    let data = [trace1];
    let layout = {
      autosize: true,
      font: {
        family: 'Noto sans, Arial',
        color: 'rgb(128,128,128)'
      },
      xaxis: {
        side: 'top'
      },
      yaxis: {
        autorange: "reversed",
        automargin: true
      },
      /*title: {
        text: plotTitle[col],
        font: {
          size: 20
        },
        xanchor: 'right',
        xref: 'paper',
        x: 1,
        yref: 'paper',
        y: 0.95,
      },*/
      margin: {
        t: 16
      }
    };
    $('#' + chartSpaces[col]).css ('display', 'block');
    Plotly.newPlot(chartSpace, data, layout);
    $('#' + histoSpaces[col]).css ('display', 'none');
  }

  function flyInHistogram (chartAreaId, chartSpaceIn, chartSpaceOut, histo) {
    chartAreas.forEach(area => flyOut(area));
    chartAreas.push(chartAreaId);
    $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");
    // compute histogram
    function frequencies(values, binsize) {
      // for each value determine the bin. Each bin gets a number from 0..n where n is the total number of bins
      let mapped = values.map(function (val) {
        return Math.ceil(val / binsize);
      });
      let freqs = new Array(Math.ceil(Math.max(...values))+1).fill(0);
      let idx;
      mapped.forEach (function (el) {
        idx = parseInt(el);
        if (freqs[idx] === 0) freqs[idx] = 1
        else freqs[idx] += 1;
      })
      return freqs;
    }

    let occArr = [];
    let ngArr = [];
    let dgArr = [];
    let btArr = [];
    let wtArr = Array.from(id2Weight, x => x[1]);
    let siArr = [];
    let plotTitle;
    let xaxisText;
    let yaxisText;
    let xVal = [];
    let yVal = [];
    let binsize;

    switch (histo) {
      case 'pv': {
        for (let ob of id2Occ) {
          occArr.push(ob[1]);
        }
        binsize = 1;
        xVal = Array.from(Array(Math.max(...occArr)+binsize).keys()).slice(1);
        yVal = frequencies(occArr,binsize).slice(1);
        plotTitle = 'Histogramm Zutatenprävalenz';
        console.log ('Schiefe des Prävalenzhistogramms: ', ss.sampleSkewness(yVal));
        break;
      }
      case 'ng' : {
        for (let ob of neigh) {
          ngArr.push(ob[1]);
        }
        binsize = 1;
        xVal = Array.from(Array(Math.max(...ngArr)+binsize).keys()).slice(1);
        yVal = frequencies(ngArr,binsize).slice(1);
        plotTitle = 'Histogramm Anz. Nachbarn'
        console.log ('Schiefe des Nachbarhistogramms: ', ss.sampleSkewness(yVal));
        xaxisText = 'Anz. Nachbarn';
        yaxisText = 'Häufigkeit';
        break;
      }
      case 'dg' : {
        for (let ob of degr) {
          dgArr.push(ob[1]);
        }
        binsize = 10;
        let len = Math.ceil((Math.max(...dgArr))/binsize);
        for (let i=0;i<=len;i++) {
          xVal[i] = i * binsize;
        }
        xVal = xVal.slice(1);
        yVal = frequencies(dgArr,binsize).slice(1);
        plotTitle = 'Histogramm Knotengrad';
        console.log ('Schiefe des Knotengradhistogramms: ', ss.sampleSkewness(yVal));
        xaxisText = 'Knotengrad';
        yaxisText = 'Häufigkeit';
        break;
      }
      // edge weight //
      case 'wt': {
        binsize = 1;
        /*xVal = Array.from(Array(Math.max(...wtArr)+1).keys()).slice(1);
        yVal = frequencies(wtArr,binsize).slice(1);*/
        let xx;
        let xxx = [];
        let yy;
        xx = Array.from(Array(Math.max(...wtArr)+1).keys()).slice(1);
        yy = frequencies(wtArr,binsize).slice(1);

        xVal = xx.map(function(val, idx){
          if (yy[idx] !== 0) {xxx.push(val)}
        })
        xVal = xxx.map(String);
        yVal = yy.filter(val => val !== 0);
        //console.log ('xVal: ', xVal)
        //console.log ('yVal: ', yVal)

        //plotTitle = 'Histogramm Zutatenbeziehungen'
        //console.log ('Schiefe des Gewichtshistogramms: ', ss.sampleSkewness(yVal));
        xaxisText = 'Kantengewicht';
        yaxisText = 'Häufigkeit';
        break;
      }
      // betweenness //
      case 'bt' : {
        for (let ob of betw) {
          btArr.push(ob[1]);
        }
        binsize = 100;
        let len = Math.ceil((Math.max(...btArr))/binsize);
        for (let i=0;i<=len;i++) {
          xVal[i] = i * binsize;
        }
        yVal = frequencies(btArr,binsize);
        plotTitle = 'Histogramm Zutatenbetweenness'
        console.log ('Schiefe des Betweennesshistogramms: ', ss.sampleSkewness(yVal));
        xaxisText = 'Betweenness';
        yaxisText = 'Häufigkeit';
        break;
      }
      case 'si': {
        binsize = 1;
        siArr = Array.from(rcpSiArr, x => x[shared]);
        yVal = frequencies(siArr,binsize).slice(1);
        xVal = Array.from(Array(Math.max(...siArr)+binsize).keys()).slice(1);
        plotTitle = 'Histogramm SI-Werte';
        xaxisText = 'Anz Shared Ingredients im Rezept';
        yaxisText = 'Anz Rezepte';
        break;
      }
      default:
        alert ('Wrong parameter for histogram selector!')
    }

    let trace1 = {
      x: xVal,
      y: yVal,
      type: 'bar',
      text: yVal.map(String),
      textposition: 'outside',
      hoverinfo: 'x+y',
      orientation: 'v',
      textangle: 90,
      marker: {
        color: 'rgb(66,114,138)',
      },
      textfont: {
        color: 'rgb(128,128,128)',
        size: 12
      }
    };

    let data = [trace1];
    let layout = {
      autosize: true,
      automargin: true,
      xaxis: {
        autotypenumbers: 'strict',
        side: 'bottom',
        tickmode: 'array',
        tickvals: xVal,
        ticktext: xVal,
        tickangle: 90,
        title: {
          text: xaxisText
        },
        type: 'category'
      },
      yaxis: {
        title: {
          text: yaxisText
        }
      },
      font: {
        color: 'rgb(128,128,128)'
      },
    };
    $('#' + chartSpaceIn).css("display", "block");
    Plotly.react(chartSpaceIn, data, layout);
    $('#' + chartSpaceOut).css("display", "none");
  }

  function flyInLorenz (chartAreaId, chartSpace) {
    chartAreas.forEach(area => flyOut(area));
    chartAreas.push(chartAreaId);
    $('#' + chartAreaId).addClass('stretchLeft').removeClass('stretchRight').css("visibility", "visible");

    // compute Lorenz curve
    function Lorenz(arr) {
      let step = 0;
      let yy = [];
      arr.forEach(function (el, i) {
        yy[i] = el[1] + step;
        step = el[1] + step;
      });
      let xVal = [];
      let yVal = [];
      xVal[0] = yVal[0] = 0;
      for (let i=1;i<10;i++) {
        xVal[i] = i*10;
        yVal[i] = ss.quantile (yy, i*0.1) / yy[yy.length-1] * 100;
      }
      xVal[10] = yVal[10] = 100;
      return {x: xVal, y: yVal}
    }

    // compute Gini coefficient
    function Gini(curve) {
      let belowLorenz = 0, prev = 0, total = 0;
      curve.forEach(function (el) {
        belowLorenz += el[1] / 2 + prev;
        prev += el[1];
        total += el[1];
      })
      let triangle = total * (curve.length) / 2;
      let GC = (triangle - belowLorenz) / triangle;
      return (GC);
    }

    let idOccArr = [];
    idOccArr.push([0,0]);
    for (let ob of id2Occ) {
      idOccArr.push(ob);
    }
    idOccArr.sort(function(a,b){
      return a[1]-b[1];
    });

    $('#GiniZutaten').text(parseFloat(Gini(idOccArr)).toFixed(3));
    $('#GiniBeziehungen').text(parseFloat(Gini(id2Weight)).toFixed(3));
    let help1 = Lorenz(idOccArr);
    let trace1 = {
      x: help1.x,
      y: help1.y,
      name: 'Zutaten',
      mode: 'lines+markers',
      textposition: 'outside',
      hoverinfo: 'x+y',
      orientation: 'h',
      marker: {
        color: 'rgb(66,114,138)',
      },
      textfont: {
        color: 'rgb(128,128,128)'
      }
    };
    let help2 = Lorenz(id2Weight);
    let trace2 = {
      x: help2.x,
      y: help2.y,
      name: 'Beziehungen',
      mode: 'lines+markers',
      textposition: 'outside',
      hoverinfo: 'x+y',
      orientation: 'h',
      marker: {
        color: 'rgb(255,0,0)',
      },
      line: {
        color: 'rgb(255,0,0)'
      },
      textfont: {
        color: 'rgb(128,128,128)'
      }
    };
    let data = [trace1, trace2];
    let layout = {
      xaxis: {
        side: 'bottom',
        automargin: true,
        ticksuffix: "%",
        title: 'Zutaten(beziehungen)'
      },
      yaxis: {
        //autorange: "reversed",
        automargin: true,
        ticksuffix: "%",
        title: 'Verwendungen'
      },
      font: {
        color: 'rgb(128,128,128)'
      },
      margin: {
        t: 16
      },
      legend: {

      }
    };
    Plotly.newPlot(chartSpace, data, layout);
  }

  function sortBy(chartSpace, colData, colSort) {
    if (colSort === Label) {
      sortByLabel(dataTable)
    } else {
      sortByCol(dataTable, -1, colSort, Label)
    };
    // Plotly.purge(document.getElementById(chartSpace));
    barChart(chartSpace, colData);
  }

  function sortByCol(arr, reverse, colIdx1, colIdx2) {
    arr.sort(sortFunction);
    function sortFunction(a, b) {
      let x = (isNaN(a[colIdx1] - b[colIdx1]) ? (a[colIdx1] === b[colIdx1]) ? 0: (a[colIdx1] < b[colIdx1]) ? -1: 1: a[colIdx1] - b[colIdx1]) ||
      (isNaN(a[colIdx2] - b[colIdx2]) ? (a[colIdx2] === b[colIdx2]) ? 0: (a[colIdx2] < b[colIdx2]) ? -1 * reverse: 1 * reverse: a[colIdx2] - b[colIdx2]);
      return (x * reverse);
    }
  }

  function sortByLabel(arr) {
    arr.sort(sortFunction);
    function sortFunction(a, b) {
      let x = (isNaN(a[Label] - b[Label]) ? (a[Label] === b[Label]) ? 0: (a[Label] < b[Label]) ? -1: 1: a[Label] - b[Label]);
      return (x);
    }
  }

  // compute connected components
  function connComp() {
    // init
    function init() {
      for (let nd of G.nodes()) {
        // node attributes object
        let n = G.node.get (nd);
        // add connected component attribute
        n.cc = 0;
      }
    }
    // recursive depth first search
    function dfs(nd, countCC) {
      let n = G.node.get (nd);
      // node attributes object
      n.cc = countCC;
      for (let neighbor of jsnx.neighbors(G, nd)) {
        let n = G.node. get (neighbor);
        if (n.cc === 0) {
          n.cc = countCC;
          dfs(neighbor, countCC);
        }
      }
    }
    // main
    init();
    let countCC = 0;
    for (let nd of G.nodes()) {
      let n = G.node.get (nd);
      if (n.cc === 0) {
        countCC++;
        dfs(nd, countCC);
      }
    }
    let nodesCC = G.nodes(true);
    let cc = [];
    // result array of arrays
    for (let i = 1; i <= countCC; i++) {
      // loop over connected components
      let temp = [];
      for (let j = 0; j < nodesCC.length; j++) {
        // loop over source array
        if (nodesCC[j][1].cc === i) {
          temp.push(nodesCC[j]);
        }
      }
      cc[i-1] = temp;
    }
    return (cc.length);
  }

  // -------------------------------------------------------
  // Stoer-Wagner mincut algorithm
  // -------------------------------------------------------
  let idArr = [];
  let connectors = [];
  let count, cc = 0;
  let Gi, Vi, Ei;
  let S = [];
  let i, j;
  let mincut;
  let start_node;
  let s, t;
  let most_conn_node;
  let phaseCut;
  let phaseCutStack = [];
  function getEdgeWeight (Gi,idArr,n,nd) {
    let w;
    let id;
    let x;
    let s, t;
    if (n.localeCompare(nd, 'de-DE-1996') === -1) {
      s = n;
      t = nd;
    } else {
      s = nd;
      t = n;
    }
    id = `${s}--${t}`
    if (idArr.includes(id)) {
      return (Gi.adj.get(s).get(t).weight)
    } else {
      return (0)
    }
  }
  /*----------------------------------------------------------------------------------*/
  function find_most_conn_node (Gi,S) {
    let i;
    let wt;
    let x;
    let nodesToSearch = [];
    let sumWeight = new Map();
    S.forEach (n => {
      jsnx.neighbors(Gi,n).forEach (nd => {nodesToSearch.push (nd)})
    })
    let search = nodesToSearch.filter(x => !S.includes(x));
    search = _.uniq (search);
    search.forEach (nd => {
      S.forEach (n => {
        wt = getEdgeWeight(Gi,idArr,n,nd)
        if (sumWeight.get(nd) > 0) {
          x = sumWeight.get(nd) + wt;
          sumWeight.set(nd,x);
        } else {
          sumWeight.set(nd,wt);
        }
      });
    });
    let aa = [...sumWeight.entries()].sort((a, b) => b[1] - a[1]);
    return aa[0][0];
  }
  /*----------------------------------------------------------------------------------*/
  function makeEdge (s,t,source,target) {
    let merged;
    let ee, ss, tt, ww;
    if (s.localeCompare(merged, 'de-DE-1996') === -1) {
      merged = `${t}%${s}`;
      ss = merged;
      tt = target;
    } else {
      merged = `${s}%${t}`;
      ss = target;
      tt = merged;
    }
    ee = {source: ss, target: tt, id: `${ss}--${tt}`, weight: Gi.adj.get(source).get(target).weight};
    // ('ee: ', ee)
    connectors.push (ee);
  }
  /*----------------------------------------------------------------------------------*/
  function merge_nodes (s,t) {
    let edge2update, wt;
    let mergedEdges;
    let dupArr;
    let uniqArr;
    /* step 1: find edges with either s or t; call them 'connectors' */
    let e, ee, ss, tt;
    connectors = [];
    for (e of Ei) {
      if ((e[0] === s) && (e[1] != t)) {
        makeEdge(s, t, e[0], e[1])
      }
      if ((e[1] === s) && (e[0] != t)) {
        makeEdge(s, t, e[1], e[0])
      }
      if ((e[0] === t) && (e[1] != s)) {
        makeEdge(s, t, e[0], e[1])
      }
      if ((e[1] === t) && (e[0] != s)) {
        makeEdge(s, t, e[1], e[0])
      }
    }
    /* step 2: find duplicate edges and add their weights */
    mergedEdges = [];
    dupArr = [];
    uniqArr = [];
    uniqArr = _.uniqBy(connectors, 'id');
    dupArr = _.difference(connectors,uniqArr,'id');
    for (e of dupArr) {
      edge2update = uniqArr.find(x => x.id === e.id);
      wt = e.weight;
      edge2update.weight += wt;
    }
    for (e of uniqArr) {
      let x = [e.source,e.target,{id: e.id, weight: e.weight}]
      mergedEdges.push(x)
    }
    /* step 4: delete s, t from Gi */
    Gi.removeNodesFrom([s,t]);
    /* step 5: add merged edges to graph */
    Gi.addEdgesFrom (mergedEdges);
    // ('Gi nodes after adding edges:', Gi.nodes());
    return (Gi);
  }
  function prepper () {
    Vi = Gi.nodes();
    Ei = Gi.edges(true);
    Gi.edges().forEach(function (edge) {
      idArr.push(Gi.adj.get(edge[0]).get(edge[1]).id);
    });
    S = [];
    S.push (start_node);
  }
  /*----------------------------------------------------------------------------------*/
  function stoerWagner () {
    /* for testing */
    /* Gi = new jsnx.Graph ();
    Gi.addEdgesFrom([
      ['eins','zwei',{id: 'eins--zwei', weight: 2}],
      ['eins','fuenf',{id: 'eins--fuenf', weight: 3}],
      ['zwei','drei',{id: 'drei--zwei', weight: 3}],
      ['zwei','fuenf',{id: 'fuenf--zwei', weight: 2}],
      ['zwei','sechs',{id: 'sechs--zwei', weight: 2}],
      ['drei','vier',{id: 'drei--vier', weight: 4}],
      ['drei','sieben',{id: 'drei--sieben', weight: 2}],
      ['vier','sieben',{id: 'sieben--vier', weight: 2}],
      ['vier','acht',{id: 'acht--vier', weight: 2}],
      ['fuenf','sechs',{id: 'fuenf--sechs', weight: 3}],
      ['sechs','sieben',{id: 'sechs--sieben', weight: 1}],
      ['sieben','acht',{id: 'acht--sieben', weight: 3}]
    ]);
    start_node  = 'zwei';*/
    /* -- init ------- */
    Gi = G1.copy();
    start_node = 'butter';
    prepper();
    /* loop over phases */
    cc = Vi.length - 1;
    //cc = 12;
    for (j=1;j<=cc;j++) {
      count = Vi.length - 1;
      for (i=1;i<=count;i++) {
        most_conn_node = find_most_conn_node(Gi,S);
        S.push (most_conn_node);
      }
      t = S.pop();
      s = S.pop();
      let w = jsnx.degree(Gi,t,'weight');
      let Gcut = new jsnx.Graph();
      Gcut = Gi.copy();
      Gcut.removeNode (t);
      phaseCut = [t,w,Gcut.nodes()];
      phaseCutStack.push(phaseCut);
      /* prepare for next phase */
      Gi = merge_nodes(s,t);
      prepper();
    }
    return ('end');
  }
