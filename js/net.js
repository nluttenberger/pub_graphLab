let G = new jsnx.MultiGraph();
let betw = new Map();
let statData = new Array();



//handle fog
function handleFog(s) {
  // remove fog from previous call to show(); install fresh fog
  if (s.select("#foggy") !== null)
    s.select("#foggy").remove();
  let bbwidth = s.getBBox().width;
  let bbheight = s.getBBox().height;
  fog.attr({
    'id': 'foggy'
  });
  fog.rect(0, 0, bbwidth + 200, bbheight + 200).attr({
    fill: 'white', fillOpacity: 0.85, "cursor": "pointer"
  });
  fog.click(function () {
    fog.remove();
    fog = null;
  });
};

//click handler: show node and its neighbours
function showIngredient(ingredient,s) {
  fog = s.g();
  handleFog(s,fog);
  let el = s.select('#'.concat(ingredient));
  let elClone = el.clone();
  let elCloneId = el.attr("id").concat("-clone");
  elClone.attr({"id":elCloneId});
  fog.append(elClone);
  //right click handler to remove shown node
  elClone.node.oncontextmenu = function(event) {
    event.preventDefault();
    fog.remove();
    fog = null;
    let elId = elCloneId.substr(0,elCloneId.indexOf('-'))
    //remove node from both svg and jsnx
    remove(elId,s);
  };
  let keller = [];
  s.selectAll("[class='edge']").forEach(function (el) {
    let tit = el.select("title").innerSVG();
    let f = tit.substr(0, tit.indexOf('-'));
    let l = tit.substr(tit.indexOf('-') + 2);
    if (f === ingredient || l === ingredient) fog.append(el.clone());
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

//remove node and all related edges from svg and jsnx
function remove(ingredient,s) {
  //remove from svg
  s.select('#'.concat(ingredient)).remove();
  s.selectAll("[class='edge']").forEach(function (el) {
    let tit = el.select("title").innerSVG();
    let f = tit.substr(0, tit.indexOf('-'));
    let l = tit.substr(tit.indexOf('-') + 2);
    if (f === ingredient) el.remove();
    if (l === ingredient) el.remove();
  });
  //remove from jsnx
  G.removeNode(ingredient);
}

// simulate button click by pressing return key
let oBInput = document.getElementById("oB");
oBInput.addEventListener("keyup", function(event) {
  // Cancel the default action, if needed
  event.preventDefault();
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Trigger the button element with a click
    document.getElementById("showBtn").click();
  }
});

// click handler: show nodes by betweenness
function show(s) {
  fog = s.g();
  handleFog(s);
  // retrieve betweenness bounds from input fields
  var ub = parseFloat(document.getElementById("uB").value);
  var ob = parseFloat(document.getElementById("oB").value);
  if (ub>ob) alert("Unterer Wert größer als oberer Wert!")
  // find keys for matching nodes
  betw.forEach(function(val,key) {
    if ((val >= ub) && (val <= ob)) {
      fog.append(s.select('#'.concat(key)).clone());
    }
  });
};

// fetch svg fragment from url, install in HTML <svg> element, and attach click handlers to ingredient nodes
let svgGraph = {
  show: function(url,divID,r) {
    let rem = this.r;
    let s = Snap(this.divID);
    $.get(this.url, function (data) {
      let boundingBox01 = data.documentElement.getAttribute("viewBox");
      //prepare svg in div
      s = s.attr({
        "xmlns": "http://www.w3.org/2000/svg",
        "xmlns:fe": "http://fruschtique.de/ns/fe",
        "viewBox": boundingBox01,
        "preserveAspectRatio": "xMidYMid meet",
        "zoomAndPan": "magnify",
        "version": "1.1",
        "contentScriptType": "text/ecmascript",
        "contentStyleType": "text/css"
      });
    });
    //load graph, select fragment, set pointer attribute and attach click handlers to nodes
    Snap.load(this.url, function (f) {
      var g0 = f.select("#graph0");
      s.append(g0);
      //attach click handlers to ingredient nodes
      if (rem === "remove") {
        s.selectAll("[class='node']").forEach(function (nd) {
          nd.attr({
            "cursor": "pointer"
          });
          nd.click(function () {
            remove(nd.attr('id'), s)
          });
        });
      } else {
        s.selectAll("[class='node']").forEach(function (nd) {
          nd.attr({
            "cursor": "pointer"
          });
          nd.node.onclick = function () {showIngredient(nd.attr('id'), s)};
          nd.node.oncontextmenu = function(event) {event.preventDefault(); console.log(nd.attr('id')); remove(nd.attr('id'), s)};
        });
      }
    });
    return s;
  }
}

//SVG graph for user interface
let graph01 = {
  url: "g_demo4Theory/graph.svg",
  divID: "#graphSpace01"
}
let s = svgGraph.show.call(graph01);
let fog = null;

// Load the Visualization API.
google.charts.load('current', {'packages': ['corechart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
  //fetch jsnx graph for graph computation
  fetch('g_demo4Theory/graph.json')
    .then(function(response) {
      if (response.ok)
        return response.json();
      else
        throw new Error('jsnx-Graph konnte nicht geladen werden!');
    })
    .then(function(graph) {
      G.addNodesFrom(graph.nodes);
      G.addEdgesFrom(graph.edges);
      betw = jsnx.betweennessCentrality(G,{'normalized': false});
      let degr = jsnx.degree(G);
      var data = new google.visualization.DataTable();
      data.addColumn('string', 'Zutat');
      data.addColumn('number', 'Prävalenz');
      data.addColumn('number', 'Knotengrad');
      data.addColumn('number', 'Betweenness');
      betw.forEach(function(val,key) {
        data.addRow([key,G.node.get(key).prevalence,degr.get(key),val]);
      });

      var options = {"vAxis": {
        showTextEvery: 1,
        textStyle: {
          fontSize: 12,
          Color: 'darkslategrey',
          fontName: 'Arial'
        }
      }};
      var chart = new google.visualization.BarChart(document.getElementById('chartBarBetween'));
      chart.draw(data, options);
    })
    .catch(function(err) {
      alert(err);
    });

  /*var options = {
    "chartArea": {
      left: "10%",
      top: "1%",
      width: "80%",
      height: "90%"
    },
    "tooltip": {
      trigger: 'none'
    },
    "titlePosition": 'none',
    "vAxis": {
      showTextEvery: 1,
      textStyle: {
        fontSize: 12,
        Color: 'darkslategrey',
        fontName: 'Arial'
      }
    },
    "hAxis": {
      textStyle: {
        fontSize: 12
      }
    },
    "annotations": {
      textStyle: {
        fontSize: 12,
        Color: 'darkslategrey',
        fontName: 'Arial',
        auraColor: 'none'
      }
    },
    "legend": "none"
  };*/
  // Instantiate and draw chart, passing in some options.

};

