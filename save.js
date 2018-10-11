var mode = "cursor";
var boards = [], b = -1, editing = [], activeEdit = [], scale = 1;;
var mx = 0, my = 0, sx = 0, sy = 0, rx = 0, ry = 0, keys = {},down = false, resizing = false, moving = false, fromMenu = true;
var editor, activeElement, dragColor, d;
var pathConnector;
var defaults = {
  tag: 'default',
  fill: "#000000",
  stroke: "#000000",
  doStroke: true,
  doFill: false,
  start: {x:null,y:null},
  end: {x:null,y:null},
  horAlignment: null,
  vertAlignment: null,
  font: "Helvetica",
  fontSize: 12,
  bold: false,
  italic: false,
  underline: false,
  justify: 'middle',
  strokeWidth: 1,
  cap: "round",
  w: null,
  h: null,
  x: null,
  y: null,
}

function load() {
  //LOADES COLOR PICKER
  editor = ace.edit("code");
  editor = ace.edit("code");
  editor.setOptions({
    showPrintMargin: false,
    showInvisibles: false,
    displayIndentGuides: true,
    fontSize: '14px',
    fontFamily: 'Source Code Pro',
    scrollPastEnd: .4,
    theme: "ace/theme/default",
    useSoftTabs: true,
    tabSize: 2,
    wrap: false
  });
  editor.session.setMode("ace/mode/svg");
  editor.getSession().on('change', function() {
    //WHEN THE USER TYPES IN THE EDITOR
  });
  var inps = document.querySelectorAll("input[data-type='radio']");
  for(var i = 0;i<inps.length;i++) {
    inps[i].oninput = function() {
      var j = document.querySelectorAll("input[name="+this.name+"]");
      for(var i=0;i<j.length;i++) {
        if(j[i]===this){continue;}
        j[i].checked = false;
      }
    };
  }
  document.getElementById("artspace").addEventListener("mousewheel", function(e) {if(b !== -1) {boards[b].zoom(e)}});
  window.addEventListener("mousemove", mouseMove);
  window.addEventListener("keyup", function(event) {delete keys[event.keyCode];keys.shift = event.shiftKey;if(event.keyCode == 32){cursor();}});
  window.addEventListener("keydown", function(event) {
    keys[event.keyCode] = true;
    keys.shift = event.shiftKey;
    if(b !== -1) {
      if(keys[32]) {cursor();}
      if(event.ctrlKey && keys[48] || event.metaKey && keys[48]) {boards[b].center();} //Center
      if(event.ctrlKey && keys[83] || event.metaKey && keys[83]) {event.preventDefault();downloadSVG();} //Download
      if(event.ctrlKey && keys[187] || event.metaKey && keys[187]) {event.preventDefault();boards[b].zoom(undefined,1);} //Zoom In
      if(event.ctrlKey && keys[189] || event.metaKey && keys[189]) {event.preventDefault();boards[b].zoom(undefined,-1);} //Zoom Out
      if(keys[46] && editing.length > 0) {for(var i=0;i<editing.length;i++) {editing[i].remove();};editing = [];}
      if(event.ctrlKey && keys[90] || event.metaKey && keys[90]) {event.preventDefault();boards[b].undo();}//Undo
      if(event.ctrlKey && keys[89] || event.metaKey && keys[89]) {event.preventDefault();boards[b].redo();}//Redo
    }
    if(event.ctrlKey && keys[79] || event.metaKey && keys[79]) {event.preventDefault();document.getElementById("upload").click();document.getElementById("upload").blur();} //Open File
    if(keys[27]) { //ESCAPE KEY (CLOSE/OPEN MENU)
      if(document.getElementById("shade").style.opacity === '0') {popup(openHTML);}
      else {
        if(document.getElementById('popup_content').children[0].className === 'flexbox' || !fromMenu){closePopup();}
        else {popup(openHTML);}
      }
    }
  });
  document.getElementById("content").addEventListener("mousedown", mouseDown);
  window.addEventListener("mouseup", mouseUp);
  d = new Detector();
  for(var i = fonts.length-1;i>=0;i--) {
    if(d.detect(fonts[i])) {
      document.getElementById("opt_font").innerHTML += '<option style="font-family:'+fonts[i]+'" value="'+fonts[i]+'">'+fonts[i]+'</option>';
    }
    else {
      fonts.splice(i,1);
    }
  }
  colorInitalize();
  updateOptions();
  new Artboard('center', 'center', 100, 100, 'Test');
  boards[b].center();
  closePopup();
  resize();
}
function resize() { //UPDATES UI ON WINDOW RESIZE
  if(document.getElementById("info").style.top !== 'calc(100vh - 34px)') {
    document.getElementById("info").style.top = 'calc(100vh - '+document.getElementById("info").offsetHeight+'px)';
  }
  //Artspace
  var off = document.getElementById("artspace").offsetTop + (window.innerHeight - document.getElementById("info").offsetTop);
  document.getElementById("artspace").style.height = 'calc(100vh - '+off+'px)';

  //Color Picker
  colorscape.style.width = 0;colorscape.style.height=0;huescale.style.width=0;huescale.style.height=0;
  colorscape.width = colorscape.parentNode.offsetWidth;colorscape.height = colorscape.parentNode.offsetHeight-4;
  huescale.width = huescale.parentNode.offsetWidth;huescale.height = huescale.parentNode.offsetHeight-4;
  colorscape.style.width = "100%";colorscape.style.height="100%";huescale.style.width="100%";huescale.style.height="100%";
  colorInitalize();
  editor.resize();
}

function setMode(md) { //SET MODE OF EDITOR
  mode = md;
  var items = document.getElementsByClassName("item");
  for(var i = 0; i < items.length; i++) {
    if(items[i].dataset.mode.toLowerCase() === md) {
      items[i].classList.add("active");
    }
    else {
      items[i].classList.remove("active");
    }
  }
  updateOptions();
}
function setOption(elem) {
  var target = editing.length > 0 ? editing : [defaults];
  var parts = elem.id.split("_");
  for(var i = 0;i<target.length;i++) {
    if(parts[1] == "x1") {target[i].start.x = elem.value;}
    else if(parts[1] == "y1") {target[i].start.y = elem.value;}
    else if(parts[1] == "x2") {target[i].end.x = elem.value;}
    else if(parts[1] == "y2") {target[i].end.y = elem.value;}
    else if(elem.type === "text" || elem.type === "number") {
      target[i][parts[1]] = elem.value;
    }
    else if(elem.dataset.type === 'radio') {
      target[i][parts[1]] = elem.checked ?  parts[2] : null;
    }
    else {
      if(parts[1] === "prev") {
        target[i][parts[2]] = elem.dataset.color;
      }
      target[i][parts[1]] = elem.checked;
    }
  }
  if(editing.length > 0) {
    for(var i=0;i<editing.length;i++) {
      editing[i].render();
    }
  }
}

function Artboard(x,y,w,h,title) { //CREATES an ARTBOARD
  x === 'center' ? x = document.getElementById('artspace').offsetWidth/2 : x=x;
  y === 'center' ? y = document.getElementById('artspace').offsetHeight/2 : y=y;
  this.e = document.createElement("div");
  this.id = boards.length;
  this.e.id = "art_" + this.id;
  this.e.className = "artboard";
  document.getElementById("artWrap").appendChild(this.e);
  this.e.innerHTML += '<svg id="svg_'+this.id+'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + w + ' ' + h + '" xml:space="preserve"></svg>';
  var self = this;
  this.e.addEventListener('mousedown', function(event) {if(b !== self.id) {self.focus();}});
  this.elements = [];
  this.markers = [];
  this.h = h;
  this.w = w;
  this.y = y;
  this.x = x;
  this.ox = x;
  this.oy = y;
  this.scale = 1;
  this.title = title;
  this.code = "";
  this.history = [];
  this.hI = -1;
  boards.push(this);
  this.change = function(code) {
    this.hI++;
    this.history.splice(this.hI, 0, this.code);
    this.code = code || document.getElementById("svg_"+this.id).innerHTML;
    editor.setValue(format(document.getElementById("svg_"+this.id).outerHTML.replace(/id=("|'|`)[^"'`]+("|'|`)\s?/gm, '')) || '<!-- SVG CODE GOES HERE -->',-1);
  }
  this.render = function() { //UPDATES VISUALS & EDITOR CODE
    this.e.style.top = this.y/this.e.parentNode.offsetHeight*100 + "%";
    this.e.style.left = this.x/this.e.parentNode.offsetWidth*100 + "%";
    this.e.style.height = this.h * this.scale + "px";
    this.e.style.width = this.w * this.scale + "px";
    document.getElementById("svg_"+this.id).innerHTML = this.code;
    document.getElementById("svg_"+this.id).onmousedown = function(event) { //WHEN YOU CLICK ON AN ELEMENT
      var id = parseInt(event.target.id.replace("elem_"+boards[b].id + '_', ""));
      if(editing.indexOf(boards[b].elements[id]) === -1) {
        if(mode === 'cursor' && id < boards[b].elements.length && !keys[32]) {
          if(!event.ctrlKey) {
            boards[b].blurElements();
            editing = [boards[b].elements[id]];
          }
          else {
            editing.push(boards[b].elements[id]);
          }
          boards[b].elements[id].onedit();
          updateOptions();
        }
        else {
          boards[b].blurElements();
        }
      }
      else if (event.ctrlKey) {
        boards[b].blurElements(boards[b].elements[id]);
      }
      for(var i=0;i<editing.length;i++) {
        editing[i].setEvent();
      }
    }
    for(var i=0;i<this.markers.length;i++) {
      this.markers[i].draw();
    }
    for(var i=0;i<this.elements.length;i++) {
      if(this.elements[i].setEvent) {this.elements[i].setEvent();}
    }
    editor.setValue(format(document.getElementById("svg_"+this.id).outerHTML.replace(/id=("|'|`)[^"'`]+("|'|`)\s?/gm, '')) || '<!-- SVG CODE GOES HERE -->',-1);
    editor.resize();
  };
  this.center = function() { //CENTERS ARTSPACE AND FULLSCREENS IT
    this.x = document.getElementById("artspace").offsetWidth/2;
    this.y = document.getElementById("artspace").offsetHeight/2;
    this.scale = Math.min((document.getElementById("artspace").offsetHeight-50)/this.h,(document.getElementById("artspace").offsetWidth-50)/this.w);
    this.render();
  };
  this.zoom = function(event,delta) { //ZOOM (ONSCROLL)
    delta = delta*this.scale/5 || Math.abs(event.wheelDelta)/event.wheelDelta*this.scale/5;
    if(Math.min(this.h*this.scale,this.w*this.scale) < 1 && delta < 0) {return;}
    this.scale += delta;
    if(this.scale < 0) {this.scale = 0;}
    this.render();
  }
  this.intake = function(code) { //ONUPLOAD TURN SVG CODE TO NEW ARTBOARD
    document.getElementById("intake").innerHTML = /(<svg([\s\S])+<\/svg>)/gim.exec(code);
    var e = document.getElementById("intake").children[0];
    var view = [e.viewBox.baseVal.x,e.viewBox.baseVal.y,e.viewBox.baseVal.width,e.viewBox.baseVal.height].join(" ");
    document.getElementById("svg_"+this.id).outerHTML = '<svg id="svg_'+this.id+'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="'+view+'" xml:space="preserve"></svg>';
    this.code += e.innerHTML;
    this.w = e.viewBox.baseVal.width;
    this.h = e.viewBox.baseVal.height;
    this.x = document.getElementById("artspace").offsetWidth/2;
    this.y = document.getElementById("artspace").offsetHeight/2;
    this.render();
  }
  this.focus = function() { //SETS THIS BOARD TO ACTIVE BOARD
    if(b !== -1) {
      boards[b].e.classList.remove('on');
      boards[b].blurElements();
    }
    b = this.id;
    this.e.classList.add('on');
    editor.setValue(format(document.getElementById("svg_"+this.id).outerHTML.replace(/id=("|'|`)[^"'`]+("|'|`)\s?/gm, '')) || "<!-- SVG CODE GOES HERE -->",-1);
    document.getElementById("title").value = this.title.replace('.svg', '');
    document.getElementById("title").style.width=inputWidth(document.getElementById("title"))+'px';
  }
  this.blurElements = function(elem) {
    if(elem && editing.indexOf(elem) > -1) {
      editing.splice(editing.indexOf(elem),1);
      updateOptions();
      var markers = elem.points || elem.marker || [elem.start,elem.end];
      for(var i = 0;i<markers.length;i++) {
        if(markers[i].marker) {markers[i].marker.style.display = "none";}
        else {markers[i].style.display = "none";}
      } 
    }
    else {
      if(editing.length > 0) {
        editing = [];
        activeEdit = [];
        updateOptions();
        for(var i = 0; i < this.markers.length; i++) {
          this.markers[i].marker.style.display = "none";
        }
      }
    }
  }
  this.undo = function() {
    console.log(this.hI)
    if(this.hI > 0) {
      this.hI --;
      this.code = this.history[this.hI];
      this.render();
    }
  }
  this.redo = function() {
    if(this.hI < this.history.length-1) {
      this.hI ++;
      this.code = this.history[this.hI];
      this.render();
    }
  }
  this.remove = function() { //DELETES ARTBOARD
    document.getElementById("artWrap").removeChild(this.e);
    boards.splice(b,1);
    for(var i = 0; i < boards.length; i++) {
      boards[i].id = i;
    }
    if(boards.length === 0) {
      document.getElementById("content").classList.add("empty");
      b = -1;
    }
    else {
      if(boards[b-1] !== undefined) {boards[b-1].focus();}
      else {boards[b].focus();}
    }
  }
  document.getElementById("content").classList.remove("empty");
  this.render();
  this.focus();
  this.change();
  setTimeout(resize,500);
}
function Point(master, x, y, temp) { //CREATES POINT
  this.id = master.board.markers.length;
  this.x = x;
  this.y = y;
  this.ox = x;
  this.oy = y;
  this.r = 5;
  this.master = master;
  this.board = master.board;
  this.ctrlX = null;
  this.ctrlY = null;
  this.marker = document.createElement("div");
  this.marker.id = "point_"+this.board.id + '_' + this.id;
  this.marker.className = "marker";var self = this;
  this.marker.onmousedown = function() {
    this.ox = this.x;
    this.oy = this.y;
    activeEdit = [self];
    for(var i = 0;i<activeEdit.length;i++) {activeEdit[i].edit();}
  }
  this.board.e.appendChild(this.marker);
  this.scale = function(factor) { //SCALES COMPONENTS
    this.x /= factor;
    this.y /= factor;
    this.ctrlX /= factor;
    this.ctrlY /= factor;
  };
  this.translate = function(x,y) { //Translates Components
    this.x = this.ox*this.board.scale + x - rsx*this.board.scale;
    this.y = this.oy*this.board.scale + y - rsy*this.board.scale;
    this.scale(this.board.scale);
    this.draw();
  }
  this.bend = function() { //CHANGES CONTROL POINTS
    this.ctrlX = rx;
    this.ctrlY = ry;
  };
  this.draw = function() { //CREATS DISPLAY POINT
    this.marker.style.height = this.marker.style.width = this.r + "px";
    this.marker.style.left = this.x / this.board.w * 100 + "%";
    this.marker.style.top = this.y / this.board.h * 100 + "%";
  };
  this.edit = function() { //EDITS DISPLAY POINT & CHORDS
    this.x = rx;
    this.y = ry;
    this.scale(this.board.scale);
    if(keys['shift']) {
      if(this.master instanceof Line) {var other = this === this.master.start ? this.master.end : this.master.start;}
      else {var other = this.master.points[this.master.points.indexOf(this)-1] || this.master.points[this.master.points.length-1];}
      var angle = Math.abs(Math.atan2(this.y-other.y,this.x-other.x));
      if(angle < Math.PI/4 || angle > Math.PI*.75) {this.y = other.y}
      else {this.x = other.x;}
    }
    this.draw();
    this.master.render();
    updateOptions();
  }
  this.remove = function() {
    this.board.markers.splice(this.id,1);
    this.board.e.removeChild(this.marker);
  }
  this.scale(this.board.scale)
  this.draw();
  if(!temp) {this.board.markers.push(this);}
}
function Group(board,elements) {
  this.tag = 'g';
  this.id = board.elements.length;
  this.board = board;
  this.elem = document.createElementNS('http://www.w3.org/2000/svg','g');
  this.marker = document.createElement("div");
  this.marker.id = "group_"+this.board.id + '_' + this.id;
  this.marker.className = "marker_group";var self = this;
  this.marker.onmousedown = function() {
    this.ox = this.x;
    this.oy = this.y;
    activeEdit = editing;
    for(var i = 0;i<activeEdit.length;i++) {activeEdit[i].edit();}
  }
  this.board.e.appendChild(this.marker);
  this.elements = elements;
  this.fill = defaults.fill;
  this.stroke = defaults.stroke;
  this.doStroke = defaults.doStroke;
  this.horAlignment = defaults.horAlignment;
  this.vertAlignment = defaults.vertAlignment;
  for(var i = 0;i<elements.length;i++) {
    this.elem.appendChild(document.getElementById(elements.elem.id));
  }
  this.box = this.elem.getBBox();
  this.x = this.ox = this.box.x;
  this.y = this.oy = this.box.y;
  this.draw = function() {
    this.marker.style.left = this.box.x + "px";
    this.marker.style.top = this.box.y + "px";
    this.marker.style.height = this.box.height + "px";
    this.marker.style.width = this.box.width + "px";
  }
  this.render = function() {
    this.box = document.getElementById(this.elem.id).getBBox();
    alignElem(this.board,this,this.horAlignment,this.vertAlignment);
    document.getElementById(this.elem.id).setAttribute("style", "translate("+(this.box.x-this.x)+"px,"+(this.box.y-this.y)+"px)");
    this.board.code = document.getElementById("svg_"+this.board.id).innerHTML;
    document.getElementById("svg_"+this.board.id).innerHTML = this.board.code;
    editor.setValue(format(document.getElementById("svg_"+this.board.id).outerHTML.replace(/id=("|'|`)[^"'`]+("|'|`)\s?/gm, '')) || '<!-- SVG CODE GOES HERE -->',-1);
    this.setEvent();
  }
  this.setEvent = function() {
    var self = this;
    document.getElementById(this.elem.id).onmousedown = function() {
      if(editing.indexOf(self) > -1) {
        activeEdit = editing;
        prepMove(activeEdit);
      }
    }
  }
  this.onedit = function() {
    this.marker.style.display = "block";
  }
  this.edit = function() {
    this.x = this.ox - rx;
    this.y = this.oy - ry;
    this.render();
    updateOptions();
  }
  this.remove = function() {
    this.board.elements.splice(this.id,1);
    this.board.e.removeChild(this.marker);
    document.getElementById("svg_"+this.board.id).removeChild(document.getElementById(this.elem.id));
    this.board.code = document.getElementById("svg_"+this.board.id).innerHTML;
    this.render();
  }
  this.board.markers.push(this);
}
function Line(board,x,y) { //CREATES NEW SVG LINE
  this.tag = 'line';
  this.id = board.elements.length;
  this.board = board;
  this.strokeWidth = defaults.strokeWidth;
  this.elem = document.createElementNS('http://www.w3.org/2000/svg','line');
  this.start = new Point(this, x, y);
  this.end = new Point(this, rx, ry);
  this.stroke = defaults.stroke;
  this.doStroke = defaults.doStroke;
  this.horAlignment = defaults.horAlignment;
  this.vertAlignment = defaults.vertAlignment;
  this.cap = defaults.cap;
  this.elem.id = "elem_"+this.board.id+'_'+this.id;
  document.getElementById("svg_"+this.board.id).appendChild(this.elem);
  this.draw = function() { //ONMOUSE MOVE TEMP DRAW SVG
    this.start.draw();
    this.end.edit();
  };
  this.toSvg = function() { //FINAL RENDERING OF SVG (ADDS TO BOARD.ELEMENTS)
    this.render();
    this.board.change();
    this.board.elements.push(this);
  };
  this.render = function() { //UPDATES VISUALS OF LINE
    alignElem(this.board,[this.start,this.end],this.horAlignment,this.vertAlignment);
    document.getElementById(this.elem.id).setAttribute("x1", this.start.x);
    document.getElementById(this.elem.id).setAttribute("y1", this.start.y);
    document.getElementById(this.elem.id).setAttribute("x2", this.end.x);
    document.getElementById(this.elem.id).setAttribute("y2", this.end.y);
    if(this.doStroke) {document.getElementById(this.elem.id).setAttribute("stroke", this.stroke);}
    else {document.getElementById(this.elem.id).removeAttribute("stroke");}
    document.getElementById(this.elem.id).setAttribute("stroke-width", this.strokeWidth);
    if(this.cap !== null) {document.getElementById(this.elem.id).setAttribute("stroke-linecap", this.cap);}
    else {document.getElementById(this.elem.id).setAttribute("stroke-linecap", 'butt');}
    this.board.code = document.getElementById("svg_"+this.board.id).innerHTML;
    document.getElementById("svg_"+this.board.id).innerHTML = this.board.code;
    editor.setValue(format(document.getElementById("svg_"+this.board.id).outerHTML.replace(/id=("|'|`)[^"'`]+("|'|`)\s?/gm, '')) || '<!-- SVG CODE GOES HERE -->',-1);
    this.setEvent();
  };
  this.setEvent = function() {
    var self = this;
    document.getElementById(this.elem.id).onmousedown = function() {
      if(editing.indexOf(self) > -1) {
        activeEdit = editing;
        prepMove(activeEdit);
      }
    }
  }
  this.onedit = function() { //ON CLICK
    this.start.marker.style.display = "block";
    this.end.marker.style.display = "block";
    this.render();
  };
  this.edit = function() {
    this.start.translate(rx,ry);
    this.end.translate(rx,ry);
    this.render();
    updateOptions();
  }
  this.remove = function() {
    this.board.elements.splice(this.id,1);
    this.start.remove();
    this.end.remove();
    document.getElementById("svg_"+this.board.id).removeChild(document.getElementById(this.elem.id));
    this.board.code = document.getElementById("svg_"+this.board.id).innerHTML;
    this.render();
  }
}
function Path(board,x,y) { //CREATES NEW SVG LINE
  this.tag = 'path';
  this.id = board.elements.length;
  this.x = 0;
  this.y = 0;
  this.w = null;
  this.h = null;
  this.board = board;
  this.strokeWidth = defaults.strokeWidth;
  this.elem = document.createElementNS('http://www.w3.org/2000/svg','path')
  this.points = [new Point(this,x,y)];
  this.newPoint = new Point(this,x,y);
  this.stroke = defaults.stroke;
  this.fill = defaults.fill;
  this.ended = false;
  this.touchingEnd = false;
  this.doStroke = defaults.doStroke;
  this.doFill = defaults.doFill;
  this.horAlignment = defaults.horAlignment;
  this.vertAlignment = defaults.vertAlignment;
  this.elem.id = "elem_"+this.board.id+'_'+this.id;
  document.getElementById("svg_"+this.board.id).appendChild(this.elem);
  this.draw = function() { //ONMOUSE MOVE TEMP DRAW SVG
    if(this.newPoint) {this.newPoint.edit();}
    if(this.newPoint.x > this.points[0].x - this.newPoint.r/4 && this.newPoint.x < this.points[0].x + this.newPoint.r/4
    && this.newPoint.y > this.points[0].y - this.newPoint.r/4 && this.newPoint.y < this.points[0].y + this.newPoint.r/4) {
      if(this.points.length > 1) {
        this.newPoint.x = this.points[0].x;
        this.newPoint.y = this.points[0].y;
      }
      this.newPoint.draw();
      this.touchingEnd = true;
    }
    else {this.touchingEnd = false;}
    this.render();
  };
  this.getD = function() {
    var d = "M " + this.points[0].x + " " + this.points[0].y;
    for(var i = 1;i<this.points.length;i++) {
      d += " L " + this.points[i].x + " " + this.points[i].y;
    }
    if(this.newPoint) {
      d += " L " + this.newPoint.x + " " + this.newPoint.y;
    }
    if(this.ended || this.touchingEnd) {
      d += " z";
    }
    return d;
  }
  this.addPoint = function(x,y,noscale) {
    if(this.touchingEnd && this.points.length > 1) {
      this.ended = true;
      this.toSvg();
    }
    else if(!this.touchingEnd) {
      var p = new Point(this,x,y);
      if(noscale) {p.scale(1/this.board.scale);}
      this.points.push(p);
    }
  }
  this.toSvg = function() { //FINAL RENDERING OF SVG (ADDS TO BOARD.ELEMENTS)
    this.newPoint = false;
    activeElement = null;
    this.render();
    this.board.change();
    this.board.elements.push(this);
  };
  this.render = function() { //UPDATES VISUALS OF LINE
    if(this.doFill) {document.getElementById(this.elem.id).setAttribute("fill", this.fill);}
    else {document.getElementById(this.elem.id).setAttribute("fill", 'rgba(0,0,0,0)');}
    if(this.doStroke) {document.getElementById(this.elem.id).setAttribute("stroke", this.stroke);}
    else {document.getElementById(this.elem.id).removeAttribute("stroke");}
    alignElem(this.board,this.points,this.horAlignment,this.vertAlignment);
    document.getElementById(this.elem.id).setAttribute("stroke-width", this.strokeWidth);
    document.getElementById(this.elem.id).setAttribute("d", this.getD());
    this.board.code = document.getElementById("svg_"+this.board.id).innerHTML;
    document.getElementById("svg_"+this.board.id).innerHTML = this.board.code;
    editor.setValue(format(document.getElementById("svg_"+this.board.id).outerHTML.replace(/id=("|'|`)[^"'`]+("|'|`)\s?/gm, '')) || '<!-- SVG CODE GOES HERE -->',-1);
    this.setEvent();
  };
  this.setEvent = function() {
    var self = this;
    document.getElementById(this.elem.id).onmousedown = function() {
      if(editing.indexOf(self) > -1) {
        activeEdit = editing;
        prepMove(activeEdit);
      }
    }
  }
  this.onedit = function() { //ON CLICK
    for(var i = 0;i<this.points.length;i++) {
      this.points[i].marker.style.display = "block";
    }
    this.render();
  };
  this.edit = function() {
    for(var i = 0;i<this.points.length;i++) {
      this.points[i].translate(rx,ry);
    }
    this.render();
    updateOptions();
  }
  this.remove = function() {
    this.board.elements.splice(this.id,1);
    for(var i = 0;i<this.points.length;i++) {
      this.points[i].remove();
    }
    document.getElementById("svg_"+this.board.id).removeChild(document.getElementById(this.elem.id));
    this.board.code = document.getElementById("svg_"+this.board.id).innerHTML;
    this.render();
  }
}







function prepMove(arr) {
  rsx = (mx - boards[b].e.getBoundingClientRect().left)/boards[b].scale;
  rsy = (my - boards[b].e.getBoundingClientRect().top)/boards[b].scale;
  for(var i =0;i<arr.length;i++) {
    var pts = arr[i].points || [arr[i].start,arr[i].end];
    for(var j = 0;j<pts.length;j++) {
      pts[j].ox = pts[j].x;
      pts[j].oy = pts[j].y;
    }
    arr[i].horAlignment = null;
    arr[i].vertAlignment = null;
    arr[i].edit();
  }
}


function mouseMove(event) {
  mx = event.clientX, my = event.clientY;
  if(b !== -1) {
    rx = mx - boards[b].e.getBoundingClientRect().left, ry = my - boards[b].e.getBoundingClientRect().top;
    if(activeElement) {
      activeElement.draw();
    }
  }
  if(keys[32] && down && b !== -1) {
    boards[b].x =  boards[b].ox + mx - sx;
    boards[b].y =  boards[b].oy + my - sy;
    boards[b].render();
  }
  if(resizing) {
    document.getElementById("info").style.transition = "unset";
    document.getElementById("artspace").style.transition = "unset";
    document.getElementById("code").style.height = window.innerHeight - my + "px";
    resize();
  }
  if(moving) {
    var cp = document.getElementById("colorpicker");
    cp.style.top = moving.y + my - sy + "px";
    cp.style.left = moving.x + mx - sx + "px";
    if(cp.offsetTop < 5) {cp.style.top = "5px";}
    if(cp.offsetTop+cp.offsetHeight > window.innerHeight-5) {cp.style.top = window.innerHeight-cp.offsetHeight-5 + "px";}
    if(cp.offsetLeft <  5) {cp.style.left = "5px";}
    if(cp.offsetLeft+cp.offsetWidth > document.body.offsetWidth-5) {cp.style.left = document.body.offsetWidth-cp.offsetWidth-5 + "px";}
  }
  if(dragColor) {
    selectColor(dragColor);
  }
  if(activeEdit.length > 0) {
    for(var i =0;i<activeEdit.length;i++) {
      activeEdit[i].edit();
      for(var j=0;j<activeEdit[i].board.elements.length;j++) {
        if(activeEdit[i].board.elements[j].setEvent) {activeEdit[i].board.elements[j].setEvent();}
      }
    }
    
  }
}
function mouseDown(event) {
  if(!down && b !== -1) {
    if(event.path.indexOf(document.getElementById("art_"+b)) === -1 && event.path.indexOf(document.getElementById("artspace")) > -1) {boards[b].blurElements();}
    sx = mx, rsx = (mx - boards[b].e.getBoundingClientRect().left)/boards[b].scale;
    sy = my, rsy = (my - boards[b].e.getBoundingClientRect().top)/boards[b].scale;
    boards[b].ox = boards[b].x;
    boards[b].oy = boards[b].y;
    if(event.path.indexOf(document.getElementById("artspace")) > -1 && !keys[32] && !activeElement) {
      if(mode === 'line') {activeElement = new Line(boards[b],rx,ry);}
      if(mode === "path" ) {activeElement = new Path(boards[b],rx,ry);}
    }
    else if(activeElement !== null && activeElement !== undefined && !keys[32] && event.path.indexOf(document.getElementById("artspace")) > -1) {
      if(mode === 'path') {
        activeElement.addPoint(activeElement.newPoint.x*activeElement.board.scale,activeElement.newPoint.y*activeElement.board.scale);
        if(activeElement) {activeElement.draw();}
      }
    }
  }
  down = true;
  cursor();
}
function mouseUp(event) {
  down = false;
  resizing = false;
  moving = false;
  dragColor = null;
  activeEdit = [];
  document.getElementById("info").style.transition = ".5s top";
  document.getElementById("artspace").style.transition = ".5s top, .5s height";
  cursor();
  if(activeElement !== null && activeElement !== undefined && !keys[32] && event.path.indexOf(document.getElementById("artspace")) > -1) {
    if(mode === 'line') {activeElement.toSvg();activeElement = null;}
  }
}



function newBoard() { //CREATES A NEW BLANK BOARD BASED ON H & W INPUTS
  filter(document.getElementById("newName"),'required');
  var name = document.getElementById("newName").value;
  var w = parseFloat(document.getElementById("width").value);
  var h = parseFloat(document.getElementById("height").value);
  new Artboard('center','center', w, h, name);
  closePopup();
  resize();
}







//UI CODE
var popupAnim;
function popup(html) { //OPENS A POPUP WITH CONTENTS OF html
  if(html === openHTML) {fromMenu = true;}
  document.getElementById("popup_content").innerHTML = html;
  document.getElementById("shade").style.opacity = '1';
  document.getElementById("shade").style.zIndex = '3';
}
function closePopup() { //CLOSES POPUP
  fromMenu = false;
  document.getElementById("shade").style.opacity = '0';
  popupAnim = setTimeout(function() {
    document.getElementById("shade").style.zIndex = '-10';
  },400);
}
function toggleCode() { //OPENS AND CLOSES CODE EDITOR
  if(document.getElementById("info").offsetTop === window.innerHeight-34) {
    document.getElementById("info").style.top = 'calc(100vh - '+document.getElementById("info").offsetHeight+'px)';
    document.getElementById("arrow").style.transform = 'translateX(-50%) rotate(180deg)';
    document.getElementById("arrow").style.fill = '#43c76a';
    var off = document.getElementById("artspace").offsetTop + document.getElementById("info").offsetHeight;
  }
  else {
    document.getElementById("info").style.top = 'calc(100vh - 34px)';
    document.getElementById("arrow").style.transform = 'translateX(-50%)';
    document.getElementById("arrow").style.fill = '#000000';
    var off = document.getElementById("artspace").offsetTop + 34;
  }
  document.getElementById("artspace").style.height = 'calc(100vh - '+off+'px)';
}
function toggleOptions(open) { //OPEN AND CLOSES OPTIONS MENU
  if(document.getElementById("options").offsetWidth === 0 && open !== false || open) {
    updateOptions();
    document.getElementById("options").style.flexBasis = "20%";
    document.getElementById("options").style.minWidth = "255px";
  }
  else {
    document.getElementById("options").style.minWidth = 0;
    document.getElementById("options").style.flexBasis = 0;
  }
  setTimeout(resize,500);
}
function updateOptions() {
  var target = editing.length > 0 ? Object.assign({},defaults,editing[0]) : defaults;
  setRadio("horAlignment", target.horAlignment, target === defaults);
  setRadio("vertAlignment", target.vertAlignment, target === defaults);
  if(target.tag === 'text' || mode === 'text') {
    document.getElementById("opt_sec_text").style.display = "block";
    document.getElementById("opt_bold").checked = target.bold;
    document.getElementById("opt_italic").checked = target.italic;
    document.getElementById("opt_underline").checked = target.underline;
    document.getElementById("opt_font").value = target.font;
    document.getElementById("opt_fontSize").value = target.fontSize;
    setRadio("justify", target.justify);
  }
  else {
    document.getElementById("opt_sec_text").style.display = "none";
  }
  if(target.tag === 'line' || mode === 'line') {
    document.getElementById("opt_sec_line").style.display = "block";
    document.getElementById("opt_sec_fill").style.display = "none";
    setRadio("cap", target.cap);
    target.strokeWidth === null && editing.length === 0 ? document.getElementById("opt_strokeWidth").disabled = true : (document.getElementById("opt_strokeWidth").disabled = false,document.getElementById("opt_strokeWidth").value = target.strokeWidth);
    target.start.x === null && editing.length === 0 ? document.getElementById("opt_x1").disabled = true : (document.getElementById("opt_x1").disabled = false, document.getElementById("opt_x1").value = Math.round(target.start.x*100)/100);
    target.start.y === null && editing.length === 0 ? document.getElementById("opt_y1").disabled = true : (document.getElementById("opt_y1").disabled = false, document.getElementById("opt_y1").value = Math.round(target.start.y*100)/100);
    target.end.x === null && editing.length === 0 ? document.getElementById("opt_x2").disabled = true : (document.getElementById("opt_x2").disabled = false, document.getElementById("opt_x2").value = Math.round(target.end.x*100)/100);
    target.end.y === null && editing.length === 0 ? document.getElementById("opt_y2").disabled = true : (document.getElementById("opt_y2").disabled = false, document.getElementById("opt_y2").value = Math.round(target.end.y*100)/100);
  }
  else {
    document.getElementById("opt_sec_line").style.display = "none";
    document.getElementById("opt_sec_fill").style.display = "block";
  }
  if(target.tag === 'path' || mode === 'path') {
    document.getElementById("opt_sec_path").style.display = "block";
    target.strokeWidth === null && editing === null ? document.getElementById("opt_strokeWidth").disabled = true : (document.getElementById("opt_strokeWidth_path").disabled = false,document.getElementById("opt_strokeWidth_path").value = target.strokeWidth);
    target.x === null && editing.length === 0 ? document.getElementById("opt_x").disabled = true : (document.getElementById("opt_x").disabled = false, document.getElementById("opt_x").value = Math.round(target.x*100)/100);
    target.y === null && editing.length === 0 ? document.getElementById("opt_y").disabled = true : (document.getElementById("opt_y").disabled = false, document.getElementById("opt_y").value = Math.round(target.y*100)/100);
    target.w === null && editing.length === 0 ? document.getElementById("opt_w").disabled = true : (document.getElementById("opt_w").disabled = false, document.getElementById("opt_w").value = Math.round(target.w*100)/100);
    target.h === null && editing.length === 0 ? document.getElementById("opt_h").disabled = true : (document.getElementById("opt_h").disabled = false, document.getElementById("opt_h").value = Math.round(target.h*100)/100);
  }
  else {
    document.getElementById("opt_sec_path").style.display = "none";
  }
  document.getElementById("opt_doStroke").checked = target.doStroke;
  document.getElementById("opt_doFill").checked = target.doFill;
  document.getElementById("opt_prev_stroke").dataset.color = target.stroke;
  document.getElementById("opt_prev_fill").dataset.color = target.fill;
  document.getElementById("opt_prev_stroke").style.backgroundImage = "linear-gradient("+target.stroke+" 100%, "+target.stroke+" 100%), url(res/transparent.jpg)";
  document.getElementById("opt_prev_fill").style.backgroundImage = "linear-gradient("+target.fill+" 100%, "+target.fill+" 100%), url(res/transparent.jpg)";
  document.getElementById("optionsHead").innerHTML = svg[target.tag] + '<h1>' + target.tag + '</h1>';
}
var notifs = {};
function notification(title,content,error) { //CREATES A NOTIFCATION
  if(document.getElementById("notification").offsetLeft < document.body.offsetWidth) {
    if(document.getElementById("notification").innerHTML === "<h3>"+title+"</h3><p>"+content+"</p>") {return;}
    notifs[Object.keys(notifs).length] = [title,content,error];
    return;
  }
  document.getElementById("notification").innerHTML = "<h3>"+title+"</h3><p>"+content+"</p>";
  if(error) {document.getElementById("notification").style.borderColor = "#ee3a3a";}
  else {document.getElementById("notification").style.borderColor = "#43c76a";}
  document.getElementById("notification").style.left = "calc(100% - " + document.getElementById("notification").offsetWidth + "px)";
  setTimeout(function() {
    document.getElementById("notification").style.left = "calc(100% + 6px)";
    setTimeout(function() {
      if(Object.keys(notifs).length > 0) {
        var next = notifs[Object.keys(notifs)[0]];
        notification(next[0],next[1],next[2]);
        delete notifs[Object.keys(notifs)[0]];
      }
    }, 1000);
  }, 5000);
}

function cursor() { //HANDLES ANY AND ALL CURSOR CHANGES
  if(b === -1) {return;}
  if(keys[32] && down) {
    document.getElementById("artspace").style.cursor = "grabbing";
  }
  else if(keys[32]) {
    document.getElementById("artspace").style.cursor = "grab";
  }
  else {
    document.getElementById("artspace").style.cursor = "auto";
  }
}



//PHP FUNCTIONS

function uploadSVG() { //GETS CODE FROM UPLOADED SVG
  var fd = new FormData(document.getElementById("uploadForm"));
  document.getElementById("upload").blur();
  post("php/upload.php", fd, function(data) {
    if(isJson(data)) {
      closePopup();
      var files = JSON.parse(data);
      Object.keys(files).forEach(function(i,index) {
        var art = new Artboard(0,0,0,0, i.replace('.svg', ''));
        art.intake(files[i]);
        art.focus();
      });
    }
    else {
      notification("Error", data, true);
    }
  });
}
function downloadSVG() { //DOWNLOADS ACTIVE SVG
  document.getElementById("loader").style.display = "block";
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'php/download.php', true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
  xhr.responseType = 'blob';
  xhr.onload = function() {
    if(xhr.status === 200) {
      var filename = boards[b].title + '.svg';
      var blob = new Blob([xhr.response], {type: xhr.response.type});
      var link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      document.getElementById("loader").style.display = "none";
    }
  };
  xhr.send('code=' + document.getElementById("svg_"+b).outerHTML);
}




//HELPER FUNCTIONS
function post(path, vars, callback, loader) { //AJAX CALL
  var xhr = new XMLHttpRequest();
  xhr.open('POST', path, true);
  if(loader !== undefined) {document.getElementById(loader).style.display = "block";}
  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4 && xhr.status == 200) {
      callback(xhr.responseText);
      if(loader !== undefined) {document.getElementById(loader).style.display = "none";}
    }
  };
  if(vars instanceof FormData) {xhr.send(vars);}
  else {
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(encode(vars));
  }
}
function encode(obj) { //HELPER FOR AJAX CALL
  var res = "";
  Object.keys(obj).forEach(function(i,index) {
    if(typeof obj[i] == "boolean") {obj[i] = obj[i.toString()];}
    res += i + "=" + encodeURIComponent(obj[i]);
    if(index !== Object.keys(obj).length-1) {res += "&"}
  });
  return res;
}

function isJson(str) { //CHECKS IF STRING IS JSON
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
function setRadio(name,active,disable) {
  var elems = document.getElementsByName(name);
  for(var i = 0;i<elems.length;i++) {
    if(disable) {
      elems[i].disabled = true;
    }
    else {
      elems[i].disabled = false;
      if(elems[i].id === "opt_"+name+"_"+active) {elems[i].checked = true;}
      else {elems[i].checked = false;}
    }
  }
}
function alignElem(board,points,hor,vert) {
  if(hor || vert) {
    var box = boundBox(points,board.w,board.h);
    for(var i=0;i<points.length;i++) {
      if(hor === "left") {points[i].x -= box[3];}
      else if(hor === "center") {points[i].x += box[4].x;}
      else if(hor === "right") {points[i].x += box[1];}
      if(vert === "top") {points[i].y -= box[0];}
      else if(vert === "middle") {points[i].y += box[4].y;}
      else if(vert === "bottom") {points[i].y += box[2];}
      points[i].draw();
    }
  }
}
function boundBox(points,w,h) {
  var box = [{y:Infinity},{x:-Infinity},{y:-Infinity},{x:Infinity}]; 
  for(var i =0;i<points.length;i++) {
    if(points[i].x < box[3].x) {box[3] = points[i];}
    if(points[i].x > box[1].x) {box[1] = points[i];}
    if(points[i].y < box[0].y) {box[0] = points[i];}
    if(points[i].y > box[2].y) {box[2] = points[i];}
  }
  var center = {x:w/2 - (box[3].x + box[1].x)/2,y:h/2 - (box[0].y + box[2].y)/2}
  return [box[0].y,w-box[1].x,h-box[2].y,box[3].x,center];// OFFSET TOP OFFSET RIGHT OFFSET BOTTOM OFFSET LEFT OFFSET CENTER
}
function inputWidth(input) { //GETS PX WIDTH OF STRING
  var tmp = document.createElement("span");
  tmp.className = "tmpspan";
  tmp.innerHTML = input.value;
  document.body.appendChild(tmp);
  var w = tmp.getBoundingClientRect().width;
  document.body.removeChild(tmp);
  return w;
}
function filter(input,type) { //FILTERS INPUT VALUES
  if(typeof input === 'string') {input = document.getElementById(input);}
  var cursor = input.selectionStart;
  var len = input.value.length;
  if(type.indexOf("number") > -1) {
    input.value = input.value.replace(/((?![0-9.]).)*/g,"");
  }
  if(type.indexOf('file') > -1) {
    input.value = input.value.replace(/((?![a-z0-9 ]).)*/ig, "");
  }
  if(type.indexOf('required') > -1 && input.value.replace(/ /g, '') === "") {
    input.value = "Untitled";
    input.style.width=inputWidth(input)+'px';
  }
  if(type.indexOf('positive') > -1 && parseFloat(input.value) < 0) {
    input.value = 0;
  }
  if(len !== input.value.length) {
    input.setSelectionRange(cursor, cursor-1);
  }
}
function format(code) {
  return style_html(code, {'indent_size': 2,'indent_char': ' ','max_char': Infinity,'brace_style': 'expand'});
}
function codeToObj(board,code) {
  var element;
  var eExp = new RegExp('<([a-z]+)([^>]+)>([^</]*)[</]+[^>]+>','gim');
  while((element = eExp.exec(code)) !== null) {
    var e;
    if(element[1] === "line") {e = new Line(board,0,0);}
    else if(element[1] === "path") {e = new Path(board,0,0);e.points = [];}
    var attribute;
    var aExp = new RegExp('([\\w\\d-]+)=[\"\'\`]([^\"\'\`]+)[\"\'\`]', 'gim');
    while((attribute = aExp.exec(element[0])) !== null) {
      switch(attribute[1]) {
        case "id": break;
        case "x1": e.start.x = parseFloat(attribute[2]); break;
        case "y1": e.start.y = parseFloat(attribute[2]); break;
        case "x2": e.end.x = parseFloat(attribute[2]); break;
        case "y2": e.end.y = parseFloat(attribute[2]); break;
        case "stroke": e.stroke = attribute[2]; break;
        case "fill": e.fill = attribute[2]; break;
        case "stroke-width": e.strokeWidth = parseFloat(attribute[2]); break;
        case "stroke-linecap": e.cap = attribute[2]; break;
        case "d": e = plotPath(e,attribute[2]); break;
        default: notification("Not Supported", "The attribute '" + attribute[1] + "' is not supported by this editor. Sorry for the inconvience.", true); break;
      }
    }
    e.toSvg();
  }
  board.render();
}
function plotPath(e,str) {
  var exp = new RegExp('([a-z])\\s*([\\d.]+)?\\s*([\\d.]+)?', 'gim');
  var cmds;
  while((cmds = exp.exec(str)) !== null) {
    console.log(cmds)
    switch(cmds[1]) {
      case "M": e.addPoint(parseFloat(cmds[2]),parseFloat(cmds[3]),true); break;
      case "L": e.addPoint(parseFloat(cmds[2]),parseFloat(cmds[3]),true); break;
      case "z": e.ended = e.touchingEnd = true; break;
      default: notification("Not Supported", "The path function '" + cmds[1] + "' is not supported by this editor. Sorry for the inconvience.", true); break;
    }
  }
  console.log(e.points);
  return e;
}

//DYNAMIC HTML
var openHTML = `
        <div class="flexbox" style="height: 100%">
          <div>
            <div class="bigbtn" onclick="popup(newHTML)">
              <center><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 455 455" style="enable-background:new 0 0 455 455," xml:space="preserve"><polygon points="455,212.5 242.5,212.5 242.5,0 212.5,0 212.5,212.5 0,212.5 0,242.5 212.5,242.5 212.5,455 242.5,455 242.5,242.5   455,242.5 "/></svg></center>
              <div>
                <h1>New</h1>
                <span>Create a new svg on a blank artboard</span>
              </div>
            </div>
            <label class="bigbtn" for="upload">
              <center><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 60 60" style="enable-background:new 0 0 60 60," xml:space="preserve"><path d="M57.49,21.5H54v-6.268c0-1.507-1.226-2.732-2.732-2.732H26.515l-5-7H2.732C1.226,5.5,0,6.726,0,8.232v43.687l0.006,0  c-0.005,0.563,0.17,1.114,0.522,1.575C1.018,54.134,1.76,54.5,2.565,54.5h44.759c1.156,0,2.174-0.779,2.45-1.813L60,24.649v-0.177  C60,22.75,58.944,21.5,57.49,21.5z M2,8.232C2,7.828,2.329,7.5,2.732,7.5h17.753l5,7h25.782c0.404,0,0.732,0.328,0.732,0.732V21.5  H12.731c-0.144,0-0.287,0.012-0.426,0.036c-0.973,0.163-1.782,0.873-2.023,1.776L2,45.899V8.232z M47.869,52.083  c-0.066,0.245-0.291,0.417-0.545,0.417H2.565c-0.243,0-0.385-0.139-0.448-0.222c-0.063-0.082-0.16-0.256-0.123-0.408l10.191-27.953  c0.066-0.245,0.291-0.417,0.545-0.417H54h3.49c0.38,0,0.477,0.546,0.502,0.819L47.869,52.083z"/></svg></center>
              <div>
                <h1>Upload</h1>
                <span>Upload and edit a svg from your computer</span>
              </div>
            </label>
            <div class="bigbtn" onclick="popup(settingsHTML)">
              <center><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512," xml:space="preserve"><path d="M328.844,368.733c-5.383-3.235-10.908-6.487-16.433-9.675c1.299-11.07,1.302-22.268,0.006-33.316    c5.546-3.2,11.068-6.45,16.425-9.671c9.02-5.42,12.78-16.856,8.744-26.603c0,0,0,0-0.001-0.001l-11.771-28.418    c-4.037-9.744-14.777-15.175-24.993-12.63c-6.071,1.511-12.274,3.118-18.455,4.776c-6.901-8.732-14.82-16.649-23.563-23.554    c1.658-6.182,3.266-12.388,4.778-18.461c2.545-10.211-2.885-20.955-12.629-24.992l-28.418-11.771    c-9.744-4.038-21.183-0.281-26.605,8.741c-3.229,5.374-6.482,10.899-9.674,16.433c-11.067-1.299-22.263-1.302-33.316-0.007    c-3.202-5.551-6.453-11.074-9.67-16.426c-5.424-9.02-16.86-12.778-26.605-8.741l-28.418,11.771    c-9.742,4.036-15.174,14.781-12.629,24.992c1.515,6.085,3.121,12.289,4.776,18.455c-8.731,6.899-16.649,14.82-23.553,23.563    c-6.196-1.663-12.402-3.269-18.463-4.779c-10.214-2.547-20.956,2.888-24.993,12.631L1.615,289.467    c-4.035,9.745-0.276,21.182,8.742,26.602c5.375,3.23,10.9,6.482,16.433,9.675c-1.298,11.066-1.301,22.262-0.006,33.316    c-5.538,3.195-11.06,6.446-16.429,9.672c-9.018,5.421-12.777,16.857-8.741,26.603l11.772,28.418    c4.036,9.743,14.775,15.176,24.993,12.63c6.064-1.51,12.268-3.116,18.453-4.776c6.901,8.731,14.82,16.647,23.563,23.553    c-1.66,6.189-3.267,12.395-4.778,18.461c-2.545,10.211,2.885,20.956,12.629,24.992l28.419,11.772    c2.64,1.093,5.403,1.615,8.137,1.615c7.362,0,14.514-3.779,18.471-10.355c3.205-5.333,6.456-10.856,9.674-16.432    c11.065,1.297,22.264,1.299,33.316,0.006c3.179,5.512,6.43,11.034,9.67,16.427c5.422,9.02,16.858,12.777,26.605,8.741    l28.418-11.771c9.742-4.036,15.174-14.781,12.629-24.992c-1.503-6.033-3.109-12.237-4.776-18.455    c8.729-6.899,16.648-14.819,23.554-23.562c6.178,1.657,12.384,3.263,18.46,4.777c10.211,2.547,20.956-2.884,24.993-12.63    l11.771-28.419C341.621,385.59,337.862,374.153,328.844,368.733z M305.116,413.834c-5.837-1.462-11.787-3.008-17.703-4.602    c-8.376-2.253-17.215,0.692-22.519,7.507c-6.096,7.83-13.151,14.886-20.968,20.973c-6.807,5.302-9.748,14.138-7.493,22.509    c1.603,5.954,3.148,11.9,4.601,17.696l-26.122,10.819c-3.107-5.184-6.218-10.481-9.259-15.765    c-4.327-7.514-12.655-11.678-21.216-10.618c-9.831,1.221-19.81,1.22-29.654-0.005c-8.585-1.066-16.906,3.098-21.232,10.614    c-3.078,5.344-6.19,10.644-9.263,15.773l-26.122-10.82c1.461-5.827,3.007-11.776,4.603-17.701    c2.255-8.375-0.692-17.215-7.507-22.52c-7.83-6.095-14.885-13.149-20.973-20.965c-5.3-6.809-14.136-9.749-22.51-7.495    c-5.923,1.595-11.87,3.141-17.695,4.601l-10.82-26.121c5.16-3.094,10.459-6.205,15.765-9.26    c7.515-4.327,11.683-12.653,10.619-21.215c-1.223-9.832-1.22-19.81,0.003-29.655c1.068-8.57-3.097-16.905-10.616-21.233    c-5.304-3.054-10.604-6.166-15.772-9.265l10.82-26.121c5.82,1.459,11.768,3.005,17.702,4.602    c8.372,2.256,17.212-0.692,22.52-7.507c6.095-7.83,13.15-14.886,20.965-20.972c6.808-5.301,9.749-14.138,7.494-22.512    c-1.59-5.904-3.136-11.85-4.601-17.694l26.122-10.819c3.084,5.146,6.196,10.444,9.259,15.765    c4.328,7.515,12.663,11.689,21.216,10.618c9.827-1.223,19.804-1.223,29.657,0.005c8.575,1.068,16.905-3.102,21.231-10.617    c3.053-5.304,6.166-10.604,9.262-15.771l26.122,10.819c-1.462,5.833-3.008,11.782-4.603,17.703    c-2.255,8.374,0.692,17.214,7.507,22.519c7.829,6.095,14.885,13.149,20.973,20.965c5.3,6.807,14.133,9.748,22.511,7.494    c5.919-1.594,11.865-3.14,17.694-4.601l10.819,26.121c-5.153,3.089-10.451,6.2-15.765,9.26    c-7.515,4.327-11.684,12.654-10.619,21.216c1.223,9.827,1.221,19.806-0.005,29.657c-1.066,8.571,3.101,16.904,10.617,21.231    c5.296,3.049,10.596,6.161,15.772,9.263L305.116,413.834z"/><path d="M241.762,312.511c0,0,0,0-0.001-0.001c-16.48-39.789-62.256-58.752-102.051-42.271    C99.922,286.721,80.958,332.501,97.44,372.29c7.983,19.276,22.997,34.287,42.271,42.272c9.637,3.991,19.763,5.987,29.889,5.987    s20.252-1.996,29.891-5.987C239.279,398.08,258.242,352.301,241.762,312.511z M190.72,393.388c-13.618,5.641-28.617,5.64-42.239,0    c-13.618-5.641-24.225-16.249-29.867-29.868c-11.647-28.114,1.753-60.462,29.868-72.107c6.885-2.852,14.021-4.202,21.047-4.202    c21.667,0,42.265,12.84,51.06,34.07C232.234,349.395,218.834,381.742,190.72,393.388z"/><path d="M496.553,100.936c-3.956-0.592-8.019-1.167-12.111-1.713c-2.062-6.857-4.816-13.505-8.214-19.819    c2.504-3.275,4.972-6.556,7.357-9.779c5.295-7.161,4.529-17.317-1.78-23.623l-15.808-15.806    c-6.309-6.31-16.465-7.075-23.624-1.778c-3.234,2.393-6.514,4.86-9.779,7.355c-6.313-3.398-12.96-6.152-19.819-8.215    c-0.547-4.092-1.12-8.155-1.712-12.11C409.746,6.642,402.024,0,393.102,0h-22.356c-8.922,0-16.644,6.642-17.961,15.447    c-0.591,3.953-1.165,8.017-1.712,12.11c-6.859,2.063-13.507,4.817-19.819,8.215c-3.263-2.496-6.545-4.964-9.778-7.355    c-7.161-5.297-17.317-4.532-23.624,1.777l-15.806,15.805c-6.31,6.308-7.077,16.465-1.78,23.627    c2.383,3.222,4.851,6.504,7.354,9.778c-3.396,6.313-6.151,12.96-8.214,19.819c-4.091,0.547-8.155,1.121-12.11,1.713    c-8.807,1.318-15.449,9.039-15.449,17.962v22.355c0,8.922,6.64,16.644,15.447,17.962c3.956,0.592,8.019,1.167,12.111,1.713    c2.063,6.858,4.817,13.505,8.214,19.819c-2.501,3.272-4.969,6.552-7.357,9.779c-5.294,7.159-4.529,17.317,1.78,23.622    l15.808,15.808c6.308,6.31,16.464,7.074,23.624,1.778c3.234-2.391,6.514-4.86,9.778-7.354c6.315,3.398,12.963,6.152,19.82,8.214    c0.545,4.091,1.12,8.155,1.712,12.111c1.318,8.806,9.04,15.448,17.962,15.448h22.356c8.922,0,16.644-6.64,17.961-15.449    c0.591-3.956,1.165-8.019,1.712-12.111c6.858-2.061,13.505-4.817,19.819-8.215c3.263,2.496,6.545,4.964,9.778,7.356    c7.159,5.297,17.317,4.532,23.624-1.777l15.808-15.806c6.309-6.308,7.075-16.465,1.778-23.626    c-2.386-3.226-4.854-6.508-7.354-9.777c3.396-6.313,6.151-12.959,8.214-19.819c4.091-0.547,8.155-1.121,12.11-1.713    c8.807-1.318,15.449-9.039,15.449-17.962v-22.355C512,109.976,505.359,102.254,496.553,100.936z M490.228,138.142    c-3.592,0.521-7.257,1.027-10.934,1.506c-7.273,0.949-13.227,6.111-15.165,13.149c-1.857,6.739-4.552,13.242-8.009,19.328    c-3.611,6.353-3.054,14.215,1.419,20.032c2.255,2.932,4.492,5.883,6.669,8.799l-11.404,11.405    c-2.925-2.183-5.876-4.419-8.802-6.669c-5.814-4.475-13.678-5.028-20.032-1.421c-6.087,3.458-12.59,6.153-19.325,8.01    c-7.042,1.94-12.204,7.894-13.15,15.165c-0.479,3.677-0.984,7.343-1.506,10.935h-16.13c-0.521-3.592-1.026-7.257-1.506-10.931    c-0.949-7.274-6.11-13.228-13.15-15.168c-6.737-1.856-13.238-4.551-19.327-8.009c-6.354-3.61-14.218-3.055-20.031,1.419    c-2.927,2.251-5.876,4.486-8.803,6.669l-11.404-11.405c2.177-2.919,4.413-5.868,6.671-8.803c4.47-5.815,5.027-13.677,1.417-20.03    c-3.457-6.086-6.152-12.59-8.009-19.327c-1.939-7.04-7.892-12.201-15.165-13.15c-3.677-0.48-7.343-0.984-10.935-1.507v-16.128    c3.592-0.521,7.257-1.027,10.934-1.506c7.273-0.949,13.227-6.111,15.165-13.149c1.857-6.738,4.551-13.241,8.009-19.328    c3.611-6.353,3.054-14.216-1.417-20.031c-2.259-2.936-4.495-5.886-6.67-8.8l11.404-11.405c2.925,2.183,5.875,4.419,8.8,6.668    c5.812,4.475,13.675,5.033,20.034,1.422c6.085-3.457,12.589-6.152,19.325-8.01c7.042-1.94,12.204-7.894,13.15-15.165    c0.48-3.677,0.986-7.342,1.507-10.934h16.13c0.521,3.591,1.026,7.256,1.505,10.931c0.949,7.274,6.111,13.228,13.15,15.167    c6.738,1.857,13.242,4.553,19.328,8.01c6.355,3.611,14.218,3.05,20.03-1.42c2.927-2.25,5.876-4.486,8.803-6.669l11.404,11.405    c-2.175,2.915-4.411,5.866-6.67,8.803c-4.471,5.814-5.027,13.676-1.419,20.029c3.457,6.088,6.152,12.592,8.009,19.328    c1.939,7.04,7.892,12.201,15.165,13.15c3.677,0.48,7.343,0.985,10.935,1.507V138.142z"/><path d="M381.924,83.675c-25.585,0-46.401,20.815-46.401,46.401c0,25.587,20.815,46.402,46.401,46.402    s46.401-20.815,46.401-46.402C428.325,104.49,407.51,83.675,381.924,83.675z M381.924,155.851    c-14.211,0-25.775-11.563-25.775-25.776c0-14.213,11.563-25.775,25.775-25.775c14.212,0,25.774,11.563,25.775,25.775    C407.699,144.288,396.136,155.851,381.924,155.851z"/></svg></center>
              <div>
                <h1>Settings</h1>
                <span>Customize your svg editing experience</span>
              </div>
            </div>
            <div class="bigbtn" onclick="popup(helpHTML)">
              <center><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 58 58" style="enable-background:new 0 0 58 58," xml:space="preserve"><path d="M56.924,36.82c0.001-0.005-0.001-0.011,0.001-0.016C57.62,34.319,58,31.704,58,29s-0.38-5.319-1.075-7.804   c-0.001-0.005,0.001-0.011-0.001-0.016c-0.002-0.008-0.008-0.013-0.01-0.02c-0.261-0.927-0.566-1.834-0.914-2.721v-0.329   c0-0.361-0.201-0.662-0.487-0.838c-0.352-0.792-0.735-1.565-1.154-2.318c0.175,0.149,0.393,0.248,0.641,0.248c0.552,0,1-0.447,1-1   v-0.977c0-0.553-0.448-1-1-1s-1,0.447-1,1v0.977c0,0.06,0.024,0.111,0.034,0.168c-0.071-0.121-0.145-0.239-0.218-0.359   c-0.013-0.022-0.026-0.044-0.04-0.065c-0.069-0.113-0.135-0.228-0.206-0.34c-0.01-0.016-0.027-0.024-0.037-0.039   c-0.651-1.032-1.361-2.023-2.133-2.962c-0.007-0.01-0.009-0.021-0.016-0.031c-0.199-0.241-0.401-0.479-0.607-0.713   c-0.015-0.017-0.036-0.024-0.052-0.04c-0.798-0.903-1.651-1.755-2.555-2.553c-0.015-0.015-0.021-0.035-0.038-0.049   c-0.234-0.205-0.471-0.407-0.711-0.604c-0.007-0.006-0.016-0.007-0.024-0.013c-0.941-0.774-1.934-1.485-2.968-2.137   c-0.015-0.011-0.023-0.027-0.04-0.038c-0.11-0.069-0.223-0.135-0.334-0.202c-0.021-0.013-0.042-0.026-0.064-0.039   c-0.122-0.074-0.244-0.15-0.367-0.222C43.687,3.975,43.745,4,43.812,4h0.977c0.552,0,1-0.447,1-1s-0.448-1-1-1h-0.977   c-0.552,0-1,0.447-1,1c0,0.253,0.102,0.477,0.256,0.653c-0.759-0.423-1.54-0.811-2.339-1.166C40.553,2.201,40.251,2,39.891,2   h-0.329c-0.888-0.349-1.796-0.654-2.724-0.915c-0.006-0.001-0.01-0.006-0.017-0.008c-0.004-0.001-0.009,0-0.013,0   C34.322,0.38,31.705,0,29,0s-5.322,0.38-7.808,1.077c-0.005,0.001-0.009,0-0.013,0c-0.006,0.001-0.01,0.006-0.017,0.008   C20.234,1.346,19.326,1.651,18.438,2h-0.329c-0.361,0-0.662,0.201-0.838,0.487c-0.792,0.352-1.565,0.735-2.318,1.154   C15.102,3.466,15.201,3.248,15.201,3c0-0.553-0.448-1-1-1h-0.977c-0.552,0-1,0.447-1,1s0.448,1,1,1h0.977   c0.06,0,0.112-0.024,0.169-0.034c-0.118,0.069-0.234,0.142-0.351,0.212c-0.028,0.017-0.055,0.033-0.083,0.05   c-0.111,0.068-0.223,0.133-0.333,0.201c-0.016,0.01-0.024,0.026-0.039,0.037C12.532,5.119,11.54,5.829,10.6,6.602   c-0.008,0.006-0.018,0.008-0.026,0.014c-0.241,0.198-0.479,0.4-0.713,0.607C9.844,7.238,9.838,7.257,9.824,7.272   C8.92,8.071,8.066,8.924,7.268,9.828C7.253,9.844,7.233,9.85,7.218,9.866c-0.206,0.234-0.408,0.472-0.607,0.713   c-0.007,0.009-0.008,0.02-0.015,0.029c-0.772,0.938-1.481,1.93-2.132,2.961c-0.011,0.016-0.029,0.025-0.039,0.042   c-0.072,0.115-0.14,0.232-0.21,0.348C4.207,13.97,4.2,13.982,4.193,13.994c-0.077,0.127-0.155,0.253-0.23,0.381   C3.975,14.313,4,14.255,4,14.188v-0.977c0-0.553-0.448-1-1-1s-1,0.447-1,1v0.977c0,0.553,0.448,1,1,1   c0.253,0,0.477-0.102,0.653-0.256c-0.423,0.759-0.811,1.54-1.166,2.339C2.201,17.447,2,17.749,2,18.109v0.329   c-0.348,0.887-0.654,1.795-0.914,2.721c-0.002,0.008-0.008,0.013-0.01,0.02c-0.001,0.005,0.001,0.011-0.001,0.016   C0.38,23.681,0,26.296,0,29s0.38,5.319,1.075,7.804c0.001,0.005-0.001,0.011,0.001,0.016c0.002,0.009,0.008,0.016,0.011,0.025   c0.26,0.925,0.565,1.831,0.913,2.717v0.329c0,0.361,0.201,0.662,0.487,0.838c0.352,0.792,0.735,1.565,1.154,2.318   C3.466,42.898,3.247,42.799,3,42.799c-0.552,0-1,0.447-1,1v0.977c0,0.553,0.448,1,1,1s1-0.447,1-1v-0.977   c0-0.059-0.024-0.11-0.034-0.167c0.074,0.126,0.151,0.25,0.227,0.374c0.007,0.012,0.014,0.024,0.022,0.036   c0.072,0.118,0.141,0.237,0.214,0.353c0.016,0.026,0.039,0.045,0.057,0.069c0.646,1.021,1.349,2.003,2.114,2.933   c0.007,0.01,0.009,0.021,0.016,0.031c0.199,0.241,0.401,0.479,0.607,0.713c0.014,0.016,0.034,0.021,0.049,0.036   c0.799,0.905,1.653,1.758,2.558,2.557c0.015,0.015,0.021,0.035,0.038,0.049c0.234,0.205,0.471,0.407,0.711,0.604   c0.008,0.007,0.019,0.009,0.027,0.015c0.94,0.773,1.932,1.483,2.965,2.135c0.015,0.011,0.023,0.027,0.04,0.038   c0.11,0.069,0.223,0.135,0.334,0.202c0.021,0.013,0.042,0.026,0.064,0.039c0.122,0.074,0.243,0.15,0.367,0.222   C14.313,54.025,14.255,54,14.188,54h-0.977c-0.552,0-1,0.447-1,1s0.448,1,1,1h0.977c0.552,0,1-0.447,1-1   c0-0.252-0.102-0.477-0.256-0.653c0.759,0.423,1.54,0.811,2.339,1.166C17.447,55.799,17.749,56,18.109,56h0.329   c0.888,0.349,1.796,0.654,2.724,0.915c0.006,0.001,0.01,0.006,0.017,0.008c0.007,0.002,0.013,0.001,0.02,0.002   C23.683,57.62,26.297,58,29,58s5.317-0.38,7.801-1.075c0.007-0.001,0.013-0.001,0.02-0.002c0.006-0.001,0.01-0.006,0.017-0.008   c0.928-0.261,1.836-0.566,2.724-0.915h0.329c0.361,0,0.662-0.201,0.838-0.487c0.792-0.352,1.566-0.735,2.318-1.154   c-0.149,0.175-0.248,0.393-0.248,0.641c0,0.553,0.448,1,1,1h0.977c0.552,0,1-0.447,1-1s-0.448-1-1-1h-0.977   c-0.06,0-0.112,0.024-0.169,0.034c0.118-0.069,0.234-0.142,0.351-0.212c0.028-0.017,0.055-0.033,0.083-0.05   c0.111-0.068,0.223-0.133,0.333-0.201c0.016-0.01,0.024-0.026,0.039-0.037c1.031-0.651,2.023-1.36,2.961-2.132   c0.009-0.007,0.021-0.01,0.03-0.017c0.241-0.198,0.479-0.4,0.713-0.607c0.016-0.014,0.022-0.034,0.037-0.049   c0.905-0.8,1.759-1.655,2.559-2.56c0.014-0.014,0.033-0.019,0.046-0.034c0.206-0.234,0.408-0.472,0.607-0.713   c0.007-0.009,0.008-0.02,0.015-0.029c0.765-0.93,1.468-1.912,2.114-2.933c0.018-0.024,0.041-0.043,0.057-0.069   c0.072-0.115,0.14-0.232,0.21-0.348c0.007-0.012,0.015-0.024,0.022-0.036c0.077-0.127,0.155-0.253,0.23-0.381   C54.025,43.688,54,43.745,54,43.812v0.977c0,0.553,0.448,1,1,1s1-0.447,1-1v-0.977c0-0.553-0.448-1-1-1   c-0.253,0-0.477,0.102-0.653,0.256c0.423-0.759,0.811-1.54,1.166-2.339C55.799,40.553,56,40.251,56,39.891v-0.329   c0.348-0.885,0.652-1.791,0.913-2.717C56.915,36.836,56.922,36.83,56.924,36.82z M52.072,43.011   c-2.248,3.688-5.354,6.796-9.039,9.047c-0.031,0.019-0.063,0.038-0.094,0.057c-1.76,1.065-3.653,1.932-5.645,2.576l-2.789-11.156   c4.153-1.579,7.452-4.878,9.031-9.031l11.156,2.789c-0.648,2.001-1.518,3.903-2.591,5.671   C52.091,42.979,52.082,42.995,52.072,43.011z M15.052,52.109c-0.025-0.015-0.05-0.03-0.075-0.045   c-3.687-2.25-6.796-5.36-9.045-9.048c-0.012-0.019-0.024-0.039-0.035-0.058c-1.071-1.766-1.941-3.666-2.588-5.665l11.156-2.789   c1.578,4.153,4.878,7.452,9.031,9.031l-2.789,11.156C18.711,54.045,16.815,53.177,15.052,52.109z M5.928,14.989   c2.248-3.688,5.354-6.796,9.039-9.047c0.031-0.019,0.063-0.038,0.094-0.057c1.76-1.065,3.653-1.932,5.645-2.576l2.789,11.156   c-4.153,1.579-7.452,4.878-9.031,9.031L3.308,20.707c0.648-2.001,1.518-3.903,2.591-5.671C5.909,15.021,5.918,15.005,5.928,14.989z    M13.875,25.409C13.601,26.564,13.44,27.762,13.44,29s0.161,2.436,0.435,3.591L2.766,35.368C2.269,33.325,2,31.194,2,29   s0.269-4.325,0.766-6.368L13.875,25.409z M15.44,29c0-7.477,6.083-13.56,13.56-13.56S42.56,21.523,42.56,29S36.477,42.56,29,42.56   S15.44,36.477,15.44,29z M42.948,5.891c0.025,0.015,0.05,0.03,0.075,0.045c3.683,2.248,6.788,5.352,9.036,9.034   c0.018,0.03,0.036,0.059,0.053,0.088c1.066,1.761,1.933,3.655,2.578,5.648l-11.156,2.789c-1.578-4.153-4.878-7.452-9.031-9.031   l2.789-11.156C39.289,3.955,41.185,4.823,42.948,5.891z M56,29c0,2.194-0.269,4.325-0.766,6.368l-11.109-2.777   c0.274-1.155,0.435-2.353,0.435-3.591s-0.161-2.436-0.435-3.591l11.109-2.777C55.731,24.675,56,26.806,56,29z M35.368,2.766   l-2.777,11.11C31.436,13.601,30.238,13.44,29,13.44s-2.436,0.161-3.591,0.435l-2.777-11.11C24.675,2.27,26.806,2,29,2   S33.325,2.27,35.368,2.766z M22.632,55.234l2.777-11.11c1.155,0.274,2.353,0.435,3.591,0.435s2.436-0.161,3.591-0.435l2.777,11.11   C33.325,55.73,31.194,56,29,56S24.675,55.73,22.632,55.234z"/><path d="M3.958,5.639c0.292,0,0.583-0.128,0.78-0.373c0.159-0.198,0.339-0.378,0.534-0.533c0.432-0.345,0.503-0.974,0.159-1.405   C5.086,2.895,4.457,2.824,4.025,3.168C3.715,3.416,3.43,3.699,3.179,4.012C2.833,4.442,2.901,5.072,3.332,5.418   C3.516,5.566,3.737,5.639,3.958,5.639z"/><path d="M3,10.304c0.552,0,1-0.447,1-1V8.326c0-0.553-0.448-1-1-1s-1,0.447-1,1v0.978C2,9.856,2.448,10.304,3,10.304z"/><path d="M8.339,4h0.977c0.552,0,1-0.447,1-1s-0.448-1-1-1H8.339c-0.552,0-1,0.447-1,1S7.787,4,8.339,4z"/><path d="M54,8.339v0.978c0,0.553,0.448,1,1,1s1-0.447,1-1V8.339c0-0.553-0.448-1-1-1S54,7.786,54,8.339z"/><path d="M53.268,5.271c0.198,0.248,0.489,0.377,0.783,0.377c0.219,0,0.438-0.071,0.623-0.218c0.432-0.345,0.503-0.974,0.159-1.405   c-0.249-0.312-0.533-0.597-0.845-0.848c-0.43-0.344-1.06-0.276-1.406,0.154c-0.346,0.431-0.277,1.061,0.154,1.406   C52.932,4.896,53.111,5.075,53.268,5.271z"/><path d="M48.696,4h0.977c0.552,0,1-0.447,1-1s-0.448-1-1-1h-0.977c-0.552,0-1,0.447-1,1S48.144,4,48.696,4z"/><path d="M53.263,52.734c-0.159,0.198-0.339,0.378-0.534,0.533c-0.432,0.345-0.503,0.974-0.159,1.405   c0.198,0.248,0.489,0.377,0.783,0.377c0.219,0,0.438-0.071,0.623-0.218c0.311-0.248,0.596-0.531,0.847-0.844   c0.346-0.431,0.278-1.061-0.153-1.406C54.239,52.237,53.609,52.306,53.263,52.734z"/><path d="M49.661,54h-0.977c-0.552,0-1,0.447-1,1s0.448,1,1,1h0.977c0.552,0,1-0.447,1-1S50.213,54,49.661,54z"/><path d="M55,47.696c-0.552,0-1,0.447-1,1v0.978c0,0.553,0.448,1,1,1s1-0.447,1-1v-0.978C56,48.144,55.552,47.696,55,47.696z"/><path d="M9.304,54H8.327c-0.552,0-1,0.447-1,1s0.448,1,1,1h0.977c0.552,0,1-0.447,1-1S9.856,54,9.304,54z"/><path d="M4,49.661v-0.978c0-0.553-0.448-1-1-1s-1,0.447-1,1v0.978c0,0.553,0.448,1,1,1S4,50.214,4,49.661z"/><path d="M4.732,52.729c-0.345-0.433-0.974-0.502-1.405-0.159c-0.432,0.345-0.503,0.974-0.159,1.405   c0.249,0.312,0.533,0.597,0.845,0.848c0.185,0.147,0.406,0.22,0.625,0.22c0.292,0,0.583-0.128,0.78-0.374   c0.346-0.431,0.277-1.061-0.154-1.406C5.068,53.104,4.889,52.925,4.732,52.729z"/></svg></center>
              <div>
                <h1>Help</h1>
                <span>List of hotkeys to get you started</span>
              </div>
            </div>
          </div>
          <div style="flex:.6;border-left: 1px solid rgba(0,0,0,.05);padding: 10px 20px;font-size: .9em;">
            <p>SVG Editor is a free online tool used for editing all aspects of svg images.<br><br>Created by Owen & Michael Kuhn.</p>
          </div>
        </div>
`;
var newHTML = `
        <center>
          <h1>New Image</h1>
          <div class="input">
            <input id="newName" type="text" spellcheck="false" oninput="filter(this,'file')" style="padding-right:40px" value="Untitled" />
            <span style="position:absolute;right:10px;top:48%;transform:translateY(-50%);">.svg</span>
            <label for="newName">Title</label>
          </div>
          <div style="display: flex;flex-wrap:wrap;align-items:center;width:50%;">
            <div class="input" style="flex:1;min-width: 6em;">
              <input id="width" type="text" oninput="filter(this,'number')" value="64" style="padding-right:30px" />
              <span style="position:absolute;right:10px;top:43%;transform:translateY(-50%);">px</span>
              <label for="width">Width</label>
            </div>
            x
            <div class="input" style="flex:1;min-width: 6em;">
              <input id="height" type="text" oninput="filter(this,'number')" value="64" style="padding-right:30px" />
              <span style="position:absolute;right:10px;top:43%;transform:translateY(-50%);">px</span>
              <label for="height">Height</label>
            </div>
          </div>
          <br>
          <div class="btn" onclick="newBoard();">Create</div>
        </center>
`;
var settingsHTML = `<center><h1>Settings</h1></center>`;
var helpHTML = `
        <center>
          <h1>Help</h1>
          <table class="help_table">
            <thead><tr><th>Windows</th><th>Mac</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td>Ctrl-S</td><td>Cmd-S</td><td>Save</td></tr>
              <tr><td>Ctrl-O</td><td>Cmd-O</td><td>Open</td></tr>
              <tr><td>Space+Drag</td><td>Space+Drag</td><td>Move artboard</td></tr>
              <tr><td>Ctrl-0</td><td>Cmd-0</td><td>Fit to screen</td></tr>
              <tr><td>Shift</td><td>Shift</td><td>Lock values</td></tr>
              <tr><td>Esc</td><td>Esc</td><td>Menu</td></tr>
              <tr><td>Ctrl-+</td><td>Cmd-+</td><td>Zoom In</td></tr>
              <tr><td>Ctrl--</td><td>Cmd--</td><td>Zoom Out</td></tr>
            </tbody>
          </table>
        </center>
`;
var colorHTML = `
        <div id="color_preview"></div>
        <input id="color_input" />
        <label id="color_label" for="color_picker">Chose Color</label/>
`;
var svg = {
  'default': `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><path d="M328.844,368.733c-5.383-3.235-10.908-6.487-16.433-9.675c1.299-11.07,1.302-22.268,0.006-33.316    c5.546-3.2,11.068-6.45,16.425-9.671c9.02-5.42,12.78-16.856,8.744-26.603c0,0,0,0-0.001-0.001l-11.771-28.418    c-4.037-9.744-14.777-15.175-24.993-12.63c-6.071,1.511-12.274,3.118-18.455,4.776c-6.901-8.732-14.82-16.649-23.563-23.554    c1.658-6.182,3.266-12.388,4.778-18.461c2.545-10.211-2.885-20.955-12.629-24.992l-28.418-11.771    c-9.744-4.038-21.183-0.281-26.605,8.741c-3.229,5.374-6.482,10.899-9.674,16.433c-11.067-1.299-22.263-1.302-33.316-0.007    c-3.202-5.551-6.453-11.074-9.67-16.426c-5.424-9.02-16.86-12.778-26.605-8.741l-28.418,11.771    c-9.742,4.036-15.174,14.781-12.629,24.992c1.515,6.085,3.121,12.289,4.776,18.455c-8.731,6.899-16.649,14.82-23.553,23.563    c-6.196-1.663-12.402-3.269-18.463-4.779c-10.214-2.547-20.956,2.888-24.993,12.631L1.615,289.467    c-4.035,9.745-0.276,21.182,8.742,26.602c5.375,3.23,10.9,6.482,16.433,9.675c-1.298,11.066-1.301,22.262-0.006,33.316    c-5.538,3.195-11.06,6.446-16.429,9.672c-9.018,5.421-12.777,16.857-8.741,26.603l11.772,28.418    c4.036,9.743,14.775,15.176,24.993,12.63c6.064-1.51,12.268-3.116,18.453-4.776c6.901,8.731,14.82,16.647,23.563,23.553    c-1.66,6.189-3.267,12.395-4.778,18.461c-2.545,10.211,2.885,20.956,12.629,24.992l28.419,11.772    c2.64,1.093,5.403,1.615,8.137,1.615c7.362,0,14.514-3.779,18.471-10.355c3.205-5.333,6.456-10.856,9.674-16.432    c11.065,1.297,22.264,1.299,33.316,0.006c3.179,5.512,6.43,11.034,9.67,16.427c5.422,9.02,16.858,12.777,26.605,8.741    l28.418-11.771c9.742-4.036,15.174-14.781,12.629-24.992c-1.503-6.033-3.109-12.237-4.776-18.455    c8.729-6.899,16.648-14.819,23.554-23.562c6.178,1.657,12.384,3.263,18.46,4.777c10.211,2.547,20.956-2.884,24.993-12.63    l11.771-28.419C341.621,385.59,337.862,374.153,328.844,368.733z M305.116,413.834c-5.837-1.462-11.787-3.008-17.703-4.602    c-8.376-2.253-17.215,0.692-22.519,7.507c-6.096,7.83-13.151,14.886-20.968,20.973c-6.807,5.302-9.748,14.138-7.493,22.509    c1.603,5.954,3.148,11.9,4.601,17.696l-26.122,10.819c-3.107-5.184-6.218-10.481-9.259-15.765    c-4.327-7.514-12.655-11.678-21.216-10.618c-9.831,1.221-19.81,1.22-29.654-0.005c-8.585-1.066-16.906,3.098-21.232,10.614    c-3.078,5.344-6.19,10.644-9.263,15.773l-26.122-10.82c1.461-5.827,3.007-11.776,4.603-17.701    c2.255-8.375-0.692-17.215-7.507-22.52c-7.83-6.095-14.885-13.149-20.973-20.965c-5.3-6.809-14.136-9.749-22.51-7.495    c-5.923,1.595-11.87,3.141-17.695,4.601l-10.82-26.121c5.16-3.094,10.459-6.205,15.765-9.26    c7.515-4.327,11.683-12.653,10.619-21.215c-1.223-9.832-1.22-19.81,0.003-29.655c1.068-8.57-3.097-16.905-10.616-21.233    c-5.304-3.054-10.604-6.166-15.772-9.265l10.82-26.121c5.82,1.459,11.768,3.005,17.702,4.602    c8.372,2.256,17.212-0.692,22.52-7.507c6.095-7.83,13.15-14.886,20.965-20.972c6.808-5.301,9.749-14.138,7.494-22.512    c-1.59-5.904-3.136-11.85-4.601-17.694l26.122-10.819c3.084,5.146,6.196,10.444,9.259,15.765    c4.328,7.515,12.663,11.689,21.216,10.618c9.827-1.223,19.804-1.223,29.657,0.005c8.575,1.068,16.905-3.102,21.231-10.617    c3.053-5.304,6.166-10.604,9.262-15.771l26.122,10.819c-1.462,5.833-3.008,11.782-4.603,17.703    c-2.255,8.374,0.692,17.214,7.507,22.519c7.829,6.095,14.885,13.149,20.973,20.965c5.3,6.807,14.133,9.748,22.511,7.494    c5.919-1.594,11.865-3.14,17.694-4.601l10.819,26.121c-5.153,3.089-10.451,6.2-15.765,9.26    c-7.515,4.327-11.684,12.654-10.619,21.216c1.223,9.827,1.221,19.806-0.005,29.657c-1.066,8.571,3.101,16.904,10.617,21.231    c5.296,3.049,10.596,6.161,15.772,9.263L305.116,413.834z"/><path d="M241.762,312.511c0,0,0,0-0.001-0.001c-16.48-39.789-62.256-58.752-102.051-42.271    C99.922,286.721,80.958,332.501,97.44,372.29c7.983,19.276,22.997,34.287,42.271,42.272c9.637,3.991,19.763,5.987,29.889,5.987    s20.252-1.996,29.891-5.987C239.279,398.08,258.242,352.301,241.762,312.511z M190.72,393.388c-13.618,5.641-28.617,5.64-42.239,0    c-13.618-5.641-24.225-16.249-29.867-29.868c-11.647-28.114,1.753-60.462,29.868-72.107c6.885-2.852,14.021-4.202,21.047-4.202    c21.667,0,42.265,12.84,51.06,34.07C232.234,349.395,218.834,381.742,190.72,393.388z"/><path d="M496.553,100.936c-3.956-0.592-8.019-1.167-12.111-1.713c-2.062-6.857-4.816-13.505-8.214-19.819    c2.504-3.275,4.972-6.556,7.357-9.779c5.295-7.161,4.529-17.317-1.78-23.623l-15.808-15.806    c-6.309-6.31-16.465-7.075-23.624-1.778c-3.234,2.393-6.514,4.86-9.779,7.355c-6.313-3.398-12.96-6.152-19.819-8.215    c-0.547-4.092-1.12-8.155-1.712-12.11C409.746,6.642,402.024,0,393.102,0h-22.356c-8.922,0-16.644,6.642-17.961,15.447    c-0.591,3.953-1.165,8.017-1.712,12.11c-6.859,2.063-13.507,4.817-19.819,8.215c-3.263-2.496-6.545-4.964-9.778-7.355    c-7.161-5.297-17.317-4.532-23.624,1.777l-15.806,15.805c-6.31,6.308-7.077,16.465-1.78,23.627    c2.383,3.222,4.851,6.504,7.354,9.778c-3.396,6.313-6.151,12.96-8.214,19.819c-4.091,0.547-8.155,1.121-12.11,1.713    c-8.807,1.318-15.449,9.039-15.449,17.962v22.355c0,8.922,6.64,16.644,15.447,17.962c3.956,0.592,8.019,1.167,12.111,1.713    c2.063,6.858,4.817,13.505,8.214,19.819c-2.501,3.272-4.969,6.552-7.357,9.779c-5.294,7.159-4.529,17.317,1.78,23.622    l15.808,15.808c6.308,6.31,16.464,7.074,23.624,1.778c3.234-2.391,6.514-4.86,9.778-7.354c6.315,3.398,12.963,6.152,19.82,8.214    c0.545,4.091,1.12,8.155,1.712,12.111c1.318,8.806,9.04,15.448,17.962,15.448h22.356c8.922,0,16.644-6.64,17.961-15.449    c0.591-3.956,1.165-8.019,1.712-12.111c6.858-2.061,13.505-4.817,19.819-8.215c3.263,2.496,6.545,4.964,9.778,7.356    c7.159,5.297,17.317,4.532,23.624-1.777l15.808-15.806c6.309-6.308,7.075-16.465,1.778-23.626    c-2.386-3.226-4.854-6.508-7.354-9.777c3.396-6.313,6.151-12.959,8.214-19.819c4.091-0.547,8.155-1.121,12.11-1.713    c8.807-1.318,15.449-9.039,15.449-17.962v-22.355C512,109.976,505.359,102.254,496.553,100.936z M490.228,138.142    c-3.592,0.521-7.257,1.027-10.934,1.506c-7.273,0.949-13.227,6.111-15.165,13.149c-1.857,6.739-4.552,13.242-8.009,19.328    c-3.611,6.353-3.054,14.215,1.419,20.032c2.255,2.932,4.492,5.883,6.669,8.799l-11.404,11.405    c-2.925-2.183-5.876-4.419-8.802-6.669c-5.814-4.475-13.678-5.028-20.032-1.421c-6.087,3.458-12.59,6.153-19.325,8.01    c-7.042,1.94-12.204,7.894-13.15,15.165c-0.479,3.677-0.984,7.343-1.506,10.935h-16.13c-0.521-3.592-1.026-7.257-1.506-10.931    c-0.949-7.274-6.11-13.228-13.15-15.168c-6.737-1.856-13.238-4.551-19.327-8.009c-6.354-3.61-14.218-3.055-20.031,1.419    c-2.927,2.251-5.876,4.486-8.803,6.669l-11.404-11.405c2.177-2.919,4.413-5.868,6.671-8.803c4.47-5.815,5.027-13.677,1.417-20.03    c-3.457-6.086-6.152-12.59-8.009-19.327c-1.939-7.04-7.892-12.201-15.165-13.15c-3.677-0.48-7.343-0.984-10.935-1.507v-16.128    c3.592-0.521,7.257-1.027,10.934-1.506c7.273-0.949,13.227-6.111,15.165-13.149c1.857-6.738,4.551-13.241,8.009-19.328    c3.611-6.353,3.054-14.216-1.417-20.031c-2.259-2.936-4.495-5.886-6.67-8.8l11.404-11.405c2.925,2.183,5.875,4.419,8.8,6.668    c5.812,4.475,13.675,5.033,20.034,1.422c6.085-3.457,12.589-6.152,19.325-8.01c7.042-1.94,12.204-7.894,13.15-15.165    c0.48-3.677,0.986-7.342,1.507-10.934h16.13c0.521,3.591,1.026,7.256,1.505,10.931c0.949,7.274,6.111,13.228,13.15,15.167    c6.738,1.857,13.242,4.553,19.328,8.01c6.355,3.611,14.218,3.05,20.03-1.42c2.927-2.25,5.876-4.486,8.803-6.669l11.404,11.405    c-2.175,2.915-4.411,5.866-6.67,8.803c-4.471,5.814-5.027,13.676-1.419,20.029c3.457,6.088,6.152,12.592,8.009,19.328    c1.939,7.04,7.892,12.201,15.165,13.15c3.677,0.48,7.343,0.985,10.935,1.507V138.142z"/><path d="M381.924,83.675c-25.585,0-46.401,20.815-46.401,46.401c0,25.587,20.815,46.402,46.401,46.402    s46.401-20.815,46.401-46.402C428.325,104.49,407.51,83.675,381.924,83.675z M381.924,155.851    c-14.211,0-25.775-11.563-25.775-25.776c0-14.213,11.563-25.775,25.775-25.775c14.212,0,25.774,11.563,25.775,25.775    C407.699,144.288,396.136,155.851,381.924,155.851z"/></svg>`,
  'cursor': `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512.001 512.001" style="enable-background:new 0 0 512.001 512.001," xml:space="preserve"><path d="M429.742,319.31L82.49,0l-0.231,471.744l105.375-100.826l61.89,141.083l96.559-42.358l-61.89-141.083L429.742,319.31zM306.563,454.222l-41.62,18.259l-67.066-152.879l-85.589,81.894l0.164-333.193l245.264,225.529l-118.219,7.512L306.563,454.222z"/></svg>`,
  'select': `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512," xml:space="preserve"><path d="M416,149.333c-8.768,0-16.939,2.667-23.723,7.211C386.432,139.947,370.581,128,352,128c-8.768,0-16.939,2.667-23.723,7.211c-5.845-16.597-21.696-28.544-40.277-28.544c-7.765,0-15.061,2.091-21.333,5.739V42.667C266.667,19.136,247.531,0,224,0s-42.667,19.136-42.667,42.667v249.408l-58.645-29.333C113.856,258.325,103.957,256,94.08,256c-22.485,0-40.747,18.283-40.747,40.875c0,10.901,4.245,21.12,11.947,28.821l137.941,137.941C234.389,494.827,275.883,512,320,512c76.459,0,138.667-62.208,138.667-138.667V192C458.667,168.469,439.531,149.333,416,149.333z M437.333,373.333c0,64.704-52.651,117.333-117.355,117.333c-38.421,0-74.517-14.955-101.653-42.133L80.363,310.592c-3.669-3.648-5.696-8.533-5.696-13.845c0-10.709,8.704-19.413,19.413-19.413c6.592,0,13.163,1.557,19.072,4.501l74.091,37.035c3.307,1.643,7.253,1.472,10.368-0.469c3.136-1.941,5.056-5.376,5.056-9.067V42.667c0-11.755,9.557-21.333,21.333-21.333s21.333,9.579,21.333,21.333v202.667c0,5.888,4.779,10.667,10.667,10.667c5.888,0,10.667-4.779,10.667-10.667v-96c0-11.755,9.557-21.333,21.333-21.333s21.333,9.579,21.333,21.333v96c0,5.888,4.779,10.667,10.667,10.667s10.667-4.779,10.667-10.667v-74.667c0-11.755,9.557-21.333,21.333-21.333s21.333,9.579,21.333,21.333v74.667c0,5.888,4.779,10.667,10.667,10.667c5.888,0,10.667-4.779,10.667-10.667V192c0-11.755,9.557-21.333,21.333-21.333s21.333,9.579,21.333,21.333V373.333z"/></svg>`,
  'line': `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512.001 512.001" style="enable-background:new 0 0 512.001 512.001," xml:space="preserve"><path d="M506.143,5.859c-7.811-7.811-20.475-7.811-28.285,0l-472,472c-7.811,7.811-7.811,20.474,0,28.284c3.905,3.906,9.024,5.858,14.142,5.858s10.237-1.953,14.143-5.858l472-472C513.954,26.333,513.954,13.67,506.143,5.859z"/></svg>`,
  'path': `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 297 297" style="enable-background:new 0 0 297 297," xml:space="preserve"><path d="M256.195,7.594c-22.498,0-40.802,18.314-40.802,40.826c0,2.994,0.333,5.912,0.947,8.725l-52.365,26.201c-7.488-8.664-18.541-14.164-30.861-14.164c-22.499,0-40.803,18.314-40.803,40.826s18.304,40.826,40.803,40.826c3.197,0,6.306-0.382,9.293-1.081l25.062,37.622c-8.351,7.481-13.618,18.34-13.618,30.411c0,2.318,0.205,4.589,0.577,6.802l-74.499,12.425c-4.998-16.894-20.641-29.259-39.125-29.259C18.305,207.754,0,226.067,0,248.578c0,22.514,18.305,40.828,40.804,40.828c19.531,0,35.893-13.805,39.872-32.174l82.316-13.73c7.487,9.211,18.897,15.109,31.661,15.109c22.501,0,40.807-18.314,40.807-40.825c0-22.511-18.306-40.825-40.807-40.825c-3.197,0-6.305,0.383-9.291,1.081L160.3,140.419c8.351-7.481,13.617-18.34,13.617-30.411c0-2.994-0.333-5.911-0.947-8.723l52.366-26.202c7.487,8.665,18.54,14.165,30.859,14.165c22.5,0,40.805-18.315,40.805-40.828C297,25.908,278.695,7.594,256.195,7.594z M40.804,269.34c-11.435,0-20.737-9.313-20.737-20.762c0-11.446,9.303-20.759,20.737-20.759s20.736,9.313,20.736,20.759C61.54,260.026,52.238,269.34,40.804,269.34z M215.394,217.786c0,11.447-9.304,20.759-20.74,20.759c-11.435,0-20.736-9.311-20.736-20.759c0-11.446,9.302-20.759,20.736-20.759C206.09,197.027,215.394,206.34,215.394,217.786z M112.378,110.008c0-11.447,9.302-20.76,20.736-20.76c11.434,0,20.736,9.313,20.736,20.76s-9.302,20.76-20.736,20.76C121.68,130.768,112.378,121.455,112.378,110.008z M256.195,69.182c-11.434,0-20.735-9.314-20.735-20.762c0-11.447,9.302-20.76,20.735-20.76c11.436,0,20.738,9.312,20.738,20.76C276.934,59.867,267.631,69.182,256.195,69.182z"/></svg>`,
  'shape': `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 485.688 485.688" style="enable-background:new 0 0 485.688 485.688," xml:space="preserve"><path d="M364.269,453.155H121.416L0,242.844L121.416,32.533h242.853l121.419,210.312L364.269,453.155z M131.905,434.997h221.878l110.939-192.152L353.783,50.691H131.905L20.966,242.844L131.905,434.997z"/></svg>`,
  'text': `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 475.082 475.082" style="enable-background:new 0 0 475.082 475.082," xml:space="preserve"><path d="M473.371,433.11c-10.657-3.997-20.458-6.563-29.407-7.706c-8.945-0.767-15.516-2.95-19.701-6.567c-2.475-1.529-5.808-6.95-9.996-16.279c-7.806-15.604-13.989-29.786-18.555-42.537c-7.427-20.181-13.617-35.789-18.565-46.829c-10.845-25.311-19.982-47.678-27.401-67.092c-4.001-10.466-15.797-38.731-35.405-84.796L255.813,24.265l-3.142-5.996h-15.129h-21.414l-79.94,206.704L68.523,400.847c-5.33,9.896-9.9,16.372-13.706,19.417c-3.996,2.848-14.466,5.805-31.405,8.843c-11.042,2.102-18.654,3.812-22.841,5.141L0,456.812h5.996c16.37,0,32.264-1.334,47.679-3.997l13.706-2.279c53.868,3.806,87.082,5.708,99.642,5.708c0.381-1.902,0.571-4.476,0.571-7.706c0-5.715-0.094-11.231-0.287-16.563c-3.996-0.568-7.851-1.143-11.561-1.711c-3.711-0.575-6.567-1.047-8.565-1.431c-1.997-0.373-3.284-0.568-3.855-0.568c-14.657-2.094-24.46-5.14-29.407-9.134c-3.236-2.282-4.854-6.375-4.854-12.278c0-3.806,2.19-11.796,6.567-23.982c14.277-39.776,24.172-65.856,29.692-78.224l128.483,0.568l26.269,65.096l13.411,32.541c1.144,3.241,1.711,6.283,1.711,9.138s-1.14,5.428-3.426,7.707c-2.285,1.905-8.753,4.093-19.417,6.563l-37.404,7.994c-0.763,6.283-1.136,13.702-1.136,22.271l16.56-0.575l57.103-3.138c10.656-0.38,23.51-0.575,38.547-0.575c18.264,0,36.251,0.763,53.957,2.282c21.313,1.523,39.588,2.283,54.819,2.283c0.192-2.283,0.281-4.754,0.281-7.423C475.082,445.957,474.513,440.537,473.371,433.11zM251.245,270.941c-2.666,0-7.662-0.052-14.989-0.144c-7.327-0.089-18.649-0.233-33.973-0.425c-15.321-0.195-29.93-0.383-43.824-0.574l48.535-128.477c7.424,15.037,16.178,35.117,26.264,60.242c11.425,27.79,20.179,50.727,26.273,68.809L251.245,270.941z"/></svg>`,
}

// COLOR STUFF
var color, hue, alpha = 1, editColor;
var colorscape, cs, huescale, ch;
var swatches = ['rgb(255, 0, 0)','rgb(255, 255, 0)','rgb(128, 255, 0)','rgb(67, 199, 106)','rgb(69, 160, 252)','rgb(68, 209, 199)','rgb(135, 54, 248)','rgb(251, 174, 253)','rgb(0, 0, 0)','rgb(72, 81, 91)','rgb(211, 213, 217)','rgb(255, 255, 255)'];
function colorInitalize() {
  colorscape = document.getElementById("colorscape");
  cs = colorscape.getContext("2d");
  huescale = document.getElementById("hue");
  ch = huescale.getContext("2d");
  var g = ch.createLinearGradient(0,0,0,huescale.height);
  g.addColorStop(0,"red");
  g.addColorStop(.17,"yellow");
  g.addColorStop(.34,"lime");
  g.addColorStop(.5,"aqua");
  g.addColorStop(.67,"blue");
  g.addColorStop(.83,"fuchsia");
  g.addColorStop(1,"red");
  ch.fillStyle = g;
  ch.fillRect(0,0,huescale.width,huescale.height);
  setGradient(pickupColor(ch,document.getElementById("hueMarker")));
  document.getElementById("alphaMarker").style.top = document.getElementById("alpha").offsetHeight - document.getElementById("alpha").offsetHeight *alpha;
  updateSwatches();
}

function setColor(c,set) {
  var tc = tinycolor(c);
  if(tc.isValid()) {
    tc.setAlpha(alpha);
    color = tc.toRgbString();
    document.getElementById("colorinput").value = tc.toHexString();
    document.getElementById("colorhex").value = alpha === 1 ? tc.toHexString() : tc.toHex8String();
    document.getElementById("colorrgb").value = color;
    document.getElementById("colorhsl").value = tc.toHslString();
    document.getElementById("colorpreview").style.backgroundImage = 'linear-gradient('+color+' 100%, '+color+' 100%), url(res/transparent.jpg)';
    if(editColor) {
      editColor.style.backgroundImage = "linear-gradient("+color+" 100%, "+color+" 100%), url(res/transparent.jpg)";
      editColor.dataset.color = color;
      setOption(editColor);
    }
  }
}
function setGradient(c,dontUpdate) {
  hue = c;
  cs.clearRect(0,0,cs.canvas.width,cs.canvas.height);
  cs.fillStyle = c;
  cs.fillRect(0,0,cs.canvas.width,cs.canvas.height);
  var value = cs.createLinearGradient(0,0,0,cs.canvas.height);
  value.addColorStop(0,"rgba(0,0,0,0)");
  value.addColorStop(1,"black");
  var saturation = cs.createLinearGradient(0,0,cs.canvas.width,0);
  saturation.addColorStop(.01,"white");
  saturation.addColorStop(1,"rgba(255,255,255,0)");
  cs.fillStyle = saturation;
  cs.fillRect(0,0,cs.canvas.width,cs.canvas.height);
  cs.fillStyle = value;
  cs.fillRect(0,0,cs.canvas.width,cs.canvas.height);
  if(dontUpdate !== true) {setColor(pickupColor(cs,document.getElementById("shadeMarker")));}
}

function selectColor(elem) {
  var marker = document.getElementById(elem.dataset.marker);
  marker.style.top = my - elem.getBoundingClientRect().top + "px";
  marker.style.left = mx - elem.getBoundingClientRect().left + "px";
  var height = elem.height-1 || elem.offsetHeight; width = elem.width-1 || elem.offsetWidth;
  if(marker.offsetTop < 0) {marker.style.top = 0+"px";}
  if(marker.offsetTop > height) {marker.style.top = height + "px";}
  if(marker.offsetLeft <  0) {marker.style.left = 0+"px";}
  if(marker.offsetLeft > width) {marker.style.left = width + "px";}
  if(elem.id == "colorscape") {
    setColor(pickupColor(cs,marker));
  }
  else if(elem.id == "hue") {
    setGradient(pickupColor(ch,marker));
  }
  else if(elem.id == "alpha") {
    alpha = (elem.offsetHeight - marker.offsetTop)/elem.offsetHeight;
    setColor(color);
  }
}

var pickerAnim;
function togglePicker(open,elem) {
  if(document.getElementById("colorpicker").style.opacity === "0" && open !== false || open === true) {
    document.getElementById("colorpicker").style.opacity = '1';
    document.getElementById("colorpicker").style.zIndex = '3';
    if(elem) {
      editColor = elem;
      inputColor(elem.style.backgroundColor);
    }
  }
  else {
    document.getElementById("colorpicker").style.opacity = '0';
    pickerAnim = setTimeout(function() {
      document.getElementById("colorpicker").style.zIndex = '-10';
    },400);
  }
}

function pickupColor(ctx,marker) {
  var data = ctx.getImageData(marker.offsetLeft,marker.offsetTop,1,1).data;
  return 'rgb('+data[0]+','+data[1]+','+data[2]+')';
}
function addSwatch(c) {
  if(swatches.indexOf(c) === -1) {
    swatches.pop();
    swatches.unshift(c);
    updateSwatches();
  }
}
function updateSwatches() {
  document.getElementById("swatches").innerHTML = "";
  for(var i = 0;i<swatches.length;i++) {
    document.getElementById("swatches").innerHTML += '<div class="swatch" onclick="inputColor(\''+swatches[i]+'\')" style="background-image: linear-gradient('+swatches[i]+' 100%, '+swatches[i]+' 100%), url(res/transparent.jpg);"></div>';
  }
}
function inputColor(c) {
  c = tinycolor(c);
  if(tinycolor(c).isValid()) {
    alpha = c.getAlpha();
    setColor(c);
    var hsv = c.toHsv();
    document.getElementById("hueMarker").style.top = Math.round(hsv.h/360*huescale.height) + "px";
    setGradient(pickupColor(ch,document.getElementById("hueMarker")),true);
    var x = Math.round(hsv.s * (colorscape.width))-1;
    var y = Math.round((1-hsv.v) * (colorscape.height));
    var marker = document.getElementById("shadeMarker");
    marker.style.top = y + "px";
    marker.style.left = x + "px";
    document.getElementById("alphaMarker").style.top = document.getElementById("alpha").offsetHeight*(1-alpha) + "px";
  }
}

//FONT DETECTOR
var fonts = ["Zurich Ex BT","Zurich BlkEx BT","ZapfHumnst Dm BT","ZapfHumnst BT","ZapfEllipt BT","Westminster Allegro","Verdana","Vagabond","Univers Condensed","Univers","Unicorn","TypoUpright BT","Tubular","Tristan","Trebuchet MS","Times New Roman PS","Times New Roman","Times","Tempus Sans ITC","Teletype","Technical","Tahoma","Swiss911 XCm BT","Swis721 BlkEx BT","Subway","Storybook","Steamer","Staccato222 BT","Souvenir Lt BT","Socket","Signboard","Sherwood","ShelleyVolante BT","Serifa Th BT","Serifa BT","Sceptre","Ribbon131 Bd BT","Pythagoras","PosterBodoni BT","Poster","Pickwick","Pegasus","PTBarnum BT","OzHandicraft BT","Onyx BT","Old Century","OCR A Extended","NewsGoth BT","News GothicMT","Monotype Corsiva","Matisse ITC","Market","Marigold","MS LineDraw","Lydian BT","Lucida Sans Unicode","Lucida Sans","Lucida Handwriting","Lucida Console","Long Island","Lithograph Light","Lithograph","Letter Gothic","Korinna BT","Kaufmann Bd BT","Kaufmann BT","Kabel Ult BT","Kabel Bk BT","Jester","Informal011 BT","Incised901 Lt BT","Incised901 Bd BT","Incised901 BT","Impact","Humanst521 Lt BT","Humanst521 BT","Humanst 521 Cn BT","Herald","Helvetica","Heather","Haettenschweiler","GoudyOLSt BT","GoudyHandtooled BT","Geometr231 Lt BT","Geometr231 Hv BT","Geometr231 BT","GeoSlab 703 XBd BT","GeoSlab 703 Lt BT","Geneva","Garamond","Galliard BT","FuturaBlack BT","Futura ZBlk BT","Futura Md BT","Futura Lt BT","Futura Bk BT","FrnkGothITC Bk BT","Freefrm721 Blk BT","Fransiscan","Exotc350 Bd BT","EngraversGothic BT","English 111 Vivace BT","Denmark","Dauphin","Cuckoo","Courier New","Courier","Coronet","Cornerstone","Copperplate Gothic Light","Copperplate Gothic Bold","CopperplGoth Bd BT","Comic Sans MS","CloisterBlack BT","Clarendon Condensed","ChelthmITC Bk BT","Chaucer","Charter Bd BT","Charter BT","Charlesworth","Cezanne","Century Schoolbook","Century Gothic","CaslonOpnface BT","Calligrapher","Calisto MT","CG Times","CG Omega","Bremen Bd BT","Boulder","Bookman Old Style","Book Antiqua","BinnerD","BernhardMod BT","BernhardFashion BT","Benguiat Bk BT","Bazooka","BankGothic Md BT","AvantGarde Md BT","AvantGarde Bk BT","Aurora Cn BT","Arrus BT","Arial Narrow","Arial MT","Arial Black","Arial","Antique Olive","AmerType Md BT","Amazone BT","Albertus Medium","Albertus Extra Bold","Abadi MT Condensed Light"];
var Detector = function() {
  var baseFonts = ['monospace', 'sans-serif', 'serif'];
  var testString = "BESbwy123";
  var testSize = '72px';
  var h = document.getElementsByTagName("body")[0];
  var s = document.createElement("span");
  s.style.fontSize = testSize;
  s.innerHTML = testString;
  var defaultWidth = {};
  var defaultHeight = {};
  for (var index in baseFonts) {
    s.style.fontFamily = baseFonts[index];
    h.appendChild(s);
    defaultWidth[baseFonts[index]] = s.offsetWidth;
    defaultHeight[baseFonts[index]] = s.offsetHeight;
    h.removeChild(s);
  }
  function detect(font) {
    var detected = false;
    for (var index in baseFonts) {
      s.style.fontFamily = font + ',' + baseFonts[index];
      h.appendChild(s);
      var matched = (s.offsetWidth != defaultWidth[baseFonts[index]] || s.offsetHeight != defaultHeight[baseFonts[index]]);
      h.removeChild(s);
      detected = detected || matched;
    }
    return detected;
  }
  this.detect = detect;
}
