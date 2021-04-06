var canvas = document.querySelector("#main_canvas");
var gl = GL.create({canvas: canvas});

var scene = new RD.Scene();

var my_cube = GL.Mesh.cube({size: 4});
gl.meshes["my_cube"] = my_cube;

var node = new RD.SceneNode();
node.mesh = "my_cube";
node.color = [1, 1, 1, 1];
node.texture = "textura_gravi.png";
node._uniforms.u_color = node.color;
scene.root.addChild(node);

var camera = new RD.Camera();
camera.lookAt( [4,4,4],[0,0,0],[0,1,0] );

var renderer = new RD.Renderer(gl);

function drawScene(){
    /*Adapt to parent div size*/
    var parent = canvas.parentNode;
	var rect = parent.getBoundingClientRect();
	canvas.width = rect.width;
	canvas.height = rect.height;
    /**/
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;

    camera.perspective( 90, canvas.width / canvas.height, 0.1, 1000 );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    renderer.render(scene, camera);
}

function updateScene(dt){

}

//last stores timestamp from previous frame
var last = performance.now();

function loop()
{
   drawScene();

   //to compute seconds since last loop
   var now = performance.now();
   //compute difference and convert to seconds
   var elapsed_time = (now - last) / 1000; 
   //store current time into last time
   last = now;

   //now we can execute our update method
   updateScene( elapsed_time );

   //request to call loop() again before next frame
   requestAnimationFrame( loop );
}

//start loop
loop();
