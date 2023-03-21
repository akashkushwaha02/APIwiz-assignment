var svg = document.getElementById("svg");
svg.ns = svg.namespaceURI;

var mouse = {
  currentInput: null,
  createPath: function (a, b) {
    var diff = {
      x: b.x - a.x,
      y: b.y - a.y,
    };

    var pathStr = "M" + a.x + "," + a.y + " ";
    pathStr += "C";
    pathStr += a.x + (diff.x / 3) * 2 + "," + a.y + " ";
    pathStr += a.x + diff.x / 3 + "," + b.y + " ";
    pathStr += b.x + "," + b.y;

    return pathStr;
  },
};

window.onmousemove = function (e) {
  if (mouse.currentInput) {
    var p = mouse.currentInput.path;
    var iP = mouse.currentInput.getAttachPoint();
    var oP = { x: e.pageX, y: e.pageY };
    var s = mouse.createPath(iP, oP);
    p.setAttributeNS(null, "d", s);
  }
};

window.onclick = function (e) {
  console.log(e);
  if (mouse.currentInput) {
    mouse.currentInput.path.removeAttribute("d");
    if (mouse.currentInput.node) {
      mouse.currentInput.node.detachInput(mouse.currentInput);
    }
    mouse.currentInput = null;
  }
};
function GetFullOffset(element) {
  var offset = {
    top: element.offsetTop,
    left: element.offsetLeft,
  };

  if (element.offsetParent) {
    var po = GetFullOffset(element.offsetParent);
    offset.top += po.top;
    offset.left += po.left;
    return offset;
  } else return offset;
}

function Node(name) {
  this.domElement = document.createElement("div");
  this.domElement.classList.add("node");
  this.domElement.setAttribute("title", name);
  var Delete = document.createElement("span");
  Delete.classList.add("delete");

  this.domElement.appendChild(Delete);
  var outDom = document.createElement("span");
  outDom.classList.add("output");
  outDom.innerHTML = "&nbsp;";
  this.domElement.appendChild(outDom);
  var that = this;
  outDom.onclick = function (e) {
    console.log(e);
    if (mouse.currentInput && !that.ownsInput(mouse.currentInput)) {
      var tmp = mouse.currentInput;
      mouse.currentInput = null;
      that.connectTo(tmp);
    }
    e.stopPropagation();
  };

  this.value = "";
  this.inputs = [];
  this.connected = false;
  this.attachedPaths = [];
}

function NodeInput(name) {
  this.name = name;
  this.node = null;
  this.domElement = document.createElement("div");
  this.domElement.innerHTML = name;
  this.domElement.classList.add("connection");
  this.domElement.classList.add("empty");

  this.path = document.createElementNS(svg.ns, "path");
  this.path.setAttributeNS(null, "stroke", "#8e8e8e");
  this.path.setAttributeNS(null, "stroke-width", "2");
  this.path.setAttributeNS(null, "fill", "none");
  svg.appendChild(this.path);

  var that = this;
  this.domElement.onclick = function (e) {
    if (mouse.currentInput) {
      if (mouse.currentInput.path.hasAttribute("d"))
        mouse.currentInput.path.removeAttribute("d");
      if (mouse.currentInput.node) {
        mouse.currentInput.node.detachInput(mouse.currentInput);
        mouse.currentInput.node = null;
      }
    }
    mouse.currentInput = that;
    if (that.node) {
      that.node.detachInput(that);
      that.domElement.classList.remove("filled");
      that.domElement.classList.add("empty");
    }
    e.stopPropagation();
  };
}

NodeInput.prototype.getAttachPoint = function () {
  var offset = GetFullOffset(this.domElement);
  return {
    x: offset.left + this.domElement.offsetWidth - 2,
    y: offset.top + this.domElement.offsetHeight / 2,
  };
};

Node.prototype.getOutputPoint = function () {
  var tmp = this.domElement.firstElementChild;
  var offset = GetFullOffset(tmp);
  return {
    x: offset.left + tmp.offsetWidth / 2,
    y: offset.top + tmp.offsetHeight / 2,
  };
};

Node.prototype.addInput = function (name) {
  var input = new NodeInput(name);
  this.inputs.push(input);
  this.domElement.appendChild(input.domElement);

  return input;
};

Node.prototype.addValue = function (name) {
  var input = new NodeInput(name);
  this.inputs.push(input);
  this.domElement.appendChild(input.domElement);

  return input;
};

Node.prototype.detachInput = function (input) {
  var index = -1;
  for (var i = 0; i < this.attachedPaths.length; i++) {
    if (this.attachedPaths[i].input == input) index = i;
  }

  if (index >= 0) {
    this.attachedPaths[index].path.removeAttribute("d");
    this.attachedPaths[index].input.node = null;
    this.attachedPaths.splice(index, 1);
  }

  if (this.attachedPaths.length <= 0) {
    this.domElement.classList.remove("connected");
  }
};

Node.prototype.ownsInput = function (input) {
  for (var i = 0; i < this.inputs.length; i++) {
    if (this.inputs[i] == input) return true;
  }
  return false;
};

Node.prototype.updatePosition = function () {
  var outPoint = this.getOutputPoint();

  var aPaths = this.attachedPaths;
  for (var i = 0; i < aPaths.length; i++) {
    var iPoint = aPaths[i].input.getAttachPoint();
    var pathStr = this.createPath(iPoint, outPoint);
    aPaths[i].path.setAttributeNS(null, "d", pathStr);
  }

  for (var j = 0; j < this.inputs.length; j++) {
    if (this.inputs[j].node != null) {
      var iP = this.inputs[j].getAttachPoint();
      var oP = this.inputs[j].node.getOutputPoint();

      var pStr = this.createPath(iP, oP);
      this.inputs[j].path.setAttributeNS(null, "d", pStr);
    }
  }
};

Node.prototype.createPath = function (a, b) {
  var diff = {
    x: b.x - a.x,
    y: b.y - a.y,
  };

  var pathStr = "M" + a.x + "," + a.y + " ";
  pathStr += "C";
  pathStr += a.x + (diff.x / 3) * 2 + "," + a.y + " ";
  pathStr += a.x + diff.x / 3 + "," + b.y + " ";
  pathStr += b.x + "," + b.y;

  return pathStr;
};

Node.prototype.connectTo = function (input) {
  input.node = this;
  this.connected = true;
  this.domElement.classList.add("connected");

  input.domElement.classList.remove("empty");
  input.domElement.classList.add("filled");

  this.attachedPaths.push({
    input: input,
    path: input.path,
  });

  var iPoint = input.getAttachPoint();
  var oPoint = this.getOutputPoint();

  var pathStr = this.createPath(iPoint, oPoint);

  input.path.setAttributeNS(null, "d", pathStr);
};

Node.prototype.moveTo = function (point) {
  this.domElement.style.top = point.y + "px";
  this.domElement.style.left = point.x + "px";
  this.updatePosition();
};

Node.prototype.initUI = function () {
  var that = this;
  $(this.domElement).draggable({
    containment: "window",
    cancel: ".connection,.output",
    drag: function (event, ui) {
      that.updatePosition();
    },
  });
  this.domElement.style.position = "absolute";
  document.body.appendChild(this.domElement);
  this.updatePosition();
};

var node = new Node("Node 1");
node.addInput("Value1");
node.addInput("Value2");
node.addInput("Value3");

var node2 = new Node("Node 2");
node2.addInput("Value1");
node2.addInput("Value2");

var node3 = new Node("Node3");
node3.addInput("Value1");
node3.addInput("Value2");
node3.addInput("Value3");

node.moveTo({ x: 250, y: 20 });
node2.moveTo({ x: 120, y: 150 });
node3.moveTo({ x: 350, y: 150 });

node.connectTo(node2.inputs[0]);
node3.connectTo(node2.inputs[1]);
node3.connectTo(node.inputs[0]);

node.initUI();
node2.initUI();
node3.initUI();

// window.addEventListener("click", (event) => {
//   console.log(event.button);
// });

var count = 1;
window.addEventListener("contextmenu", (event) => {
  event.preventDefault();

  if (event.button === 2) {
    const val = "New Node" + count;
    var node4 = new Node(val);
    node4.addInput("Value");
    node4.initUI();
    count++;
  }
});

function generateNode() {
  const val = "New Node" + count;
  var node4 = new Node(val);
  node4.addInput("Value");
  node4.initUI();
  count++;
}

// function deleteNode(node) {
//   console.log(node2);
// }
