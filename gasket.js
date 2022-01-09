
var canvas;
var gl;
var colorBuffer;
var vertexBuffer;
var positions = [];
var colors = [];
var color1 = vec3(1.0, 0.0, 0.0);
var color2 = vec3(0.0, 1.0, 0.0);
var color3 = vec3(0.0, 0.0, 1.0);
var timeframe = 50;
var direction = true;
var play = false;
var speed = 0.15;
var theta = 0.0;
var thetaLoc;

var numTimesToSubdivide = 5;

var vertices = [
    vec3(0.0000, 0.0000, 0.0000), //center vertex
    vec3(0.0000, 1.0000, 0.0000), //top vertex
    vec3(-0.8660, -0.5, 0.0000), //left vertex
    vec3(0.8660, -0.5, 0.0000), //right vertex
]

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], numTimesToSubdivide);

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    
    // Associate out shader variables with our data buffer

    thetaLoc = gl.getUniformLocation(program, "uTheta");

    //Change and update the first triangle color when the color is changed
    document.getElementById("color1").onchange = function(event) {
        //Remove the first character # from the hex code
        color1 = changeColor(event.target.value.substring(1));
        //Update the gasket color after changing the color
        updateColor();
    };
    //Change and update the second triangle color when the color is changed
    document.getElementById("color2").onchange = function(event) {
        //Remove the first character # from the hex code
        color2 = changeColor(event.target.value.substring(1));
        //Update the gasket color after changing the color
        updateColor();
    };
    //Change and update the third triangle color when the color is changed
    document.getElementById("color3").onchange = function(event) {
        //Remove the first character # from the hex code
        color3 = changeColor(event.target.value.substring(1));
        //Update the gasket color after changing the color
        updateColor();
    };

    document.getElementById("subdivision").onchange = function(event) {
        let previousNum = numTimesToSubdivide;
        numTimesToSubdivide = parseInt(event.target.value);
        if(numTimesToSubdivide>previousNum){
            updateColor();
        }
        if(!play){
            updateGasket();
        }
    };

    document.getElementById("speed").onchange = function(event) {
        speed = 0.05*event.target.value;
    };

    document.getElementById("direction").onclick = function() {
        direction = !direction;
    };

    document.getElementById("play").onclick = function(event) {
        if(play){
            event.target.innerHTML = "Play ";
        }
        else event.target.innerHTML = "Pause";
        play = !play;
    };

    numTimesToSubdivide = 3;
    updateGasket();
    render();
};

function render()
{
    if(play){
        theta += (direction ? speed : -speed);
        updateGasket();
    }
    if(Math.abs(theta) >= Math.PI){
        direction = !direction;
    }
    setTimeout(
        function () {requestAnimationFrame(render);},
        //Render every 50ms
        timeframe
    );
}

function updateGasket()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(thetaLoc, theta);
    positions = [];
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], numTimesToSubdivide);
    //Load the updated positions to vertex buffer
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(positions));
    //After both color buffer and vertex buffer are loaded, draw the updated triangles
    gl.drawArrays(gl.TRIANGLES, 0, positions.length);
}

function changeColor(hexColor){
    let rgbColor = [];
    for(let i=0; i<hexColor.length; i+=2){
        rgbColor.push(parseInt(hexColor[i]+hexColor[i+1], 16)/255);
    }
    return vec3(rgbColor[0], rgbColor[1], rgbColor[2]);
}

function updateColor()
{
    //Save the current gasket action status
    let currentAction = play;
    //Pause the gasket not matter is playing or not
    play = false;
    colors = [];
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], numTimesToSubdivide);
    //Bind color buffer to gl
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    //Load the updated color values to color buffer
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(colors));
    gl.drawArrays(gl.TRIANGLES, 0, positions.length);
    //Bind the vertex buffer back to gl
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //Store the gasket action status not matter is playing or not
    play = currentAction;
}

function triangle(a, b, c, color)
{
    // add colors and vertices for one triangle
    var triColors = [
        color1,
        color2,
        color3,
        vec3(0.0, 0.0, 0.0)
    ];

    colors.push(triColors[color]);
    positions.push(a);
    colors.push(triColors[color]);
    positions.push(b);
    colors.push(triColors[color]);
    positions.push(c);
}

function tetra( a, b, c, d )
{
    // tetrahedron with each side using
    // a different color

    triangle(a, c, b, 0);
    triangle(a, c, d, 1);
    triangle(a, b, d, 2);
    triangle(b, c, d, 3);
}

function divideTetra(a, b, c, d, count)
{
    // check for end of recursion

    if (count === 0) {
        tetra(a, b, c, d);
    }

    // find midpoints of sides
    // divide four smaller tetrahedra

    else {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var ad = mix(a, d, 0.5);
        var bc = mix(b, c, 0.5);
        var bd = mix(b, d, 0.5);
        var cd = mix(c, d, 0.5);

        --count;

        divideTetra(a, ab, ac, ad, count);
        divideTetra(ab,  b, bc, bd, count);
        divideTetra(ac, bc,  c, cd, count);
        divideTetra(ad, bd, cd,  d, count);
    }
}
