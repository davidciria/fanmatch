//setup context
var canvas = document.querySelector("canvas");
var gl = GL.create({canvas: canvas});
var freecam = false;

gl.captureMouse();
gl.captureKeys();
gl.onmouse = onMouse;
gl.onkeydown = onKey;

//Our Scene


//scene container
var scene = new RD.Scene();

var walk_area = new WalkArea();
walk_area.addRect([-1.8,0.1,-0.8],3.6,1.6);

var CHARACTERS_LAYER = 4; //4 is 100 in binary

var character = new RD.SceneNode();
character.name = "char";
character.layers = CHARACTERS_LAYER; //layer 0b1 and 0b10 is for objects, layer 0b100 for characters
character.is_character = true; //in case we want to know if an scene node is a character
character.scale(0.35);
character.mesh = "data/export.wbin";
character.texture = "data/skaterMaleA.png";
character.anim_name = "idle";
scene.root.addChild( character );

var floor_node = new RD.SceneNode();
floor_node.color = [0.7,0.7,0.7,1];
floor_node.name = "floor";
floor_node.mesh = "planeXZ";
floor_node.scale(10);
floor_node.textures.color = "data/grid.png";
//scene.root.addChild( floor_node );

var room_node = new RD.SceneNode();
room_node.name = "room";
room_node.flags.two_sided = true;
room_node.mesh = "data/room.obj";
room_node.textures.color = "data/room.png";
scene.root.addChild( room_node );

//for debugging
var sphere = new RD.SceneNode();
sphere.layers = 2;
sphere.mesh = "sphere";
sphere.scale(0.05);
scene.root.addChild( sphere );

//camera
var camera = new RD.Camera();
camera.lookAt([0,1.5,4],[0,1,0],[0,1,0]); //to set eye,center and up
camera.fov = 60;

//renderer of the scene
var renderer = new RD.Renderer(gl);

//animations container
var animations = {};

function loadAnimation( name, url )
{
	var anim = new RD.SkeletalAnimation();
	anim.load(url);
	animations[ name ] = anim;
}

loadAnimation("idle", "data/anims/idle_gen.skanim");
loadAnimation("walking", "data/anims/walking_gen.skanim");
//loadAnimation("dancing", "data/anims/girl_dancing.skanim");

//we need an skeletonm if we plan to do blending
var skeleton = new RD.Skeleton(); //skeleton for blending

//draws the whole frame
function draw()
{
	if(!freecam)
		camera.lookAt( camera.position, character.localToGlobal([0,2,0]), [0,1,0] );

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	camera.perspective(camera.fov,canvas.width / canvas.height,0.1,1000); //to render in perspective mode

	//clear
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0,0,0,1 );
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	drawWorld( camera );
}

//draws the world from a camera point of view
function drawWorld( camera )
{
	renderer.render( scene, camera );

	//render gizmos
	//areas
	//var vertices = walk_area.getVertices();
	//if(vertices)
	//	renderer.renderPoints(vertices,null,camera,null,null,0.1,gl.LINES);

	/*
	gl.disable( gl.DEPTH_TEST );
	if(character.skeleton)
	{
		var vertices = character.skeleton.getVertices( character.getGlobalMatrix() );
		if(vertices)
			renderer.renderPoints(vertices,null,camera,null,null,0.1,gl.LINES);
		gl.enable( gl.DEPTH_TEST );
	}
	*/
}

//CONTROLLER
function update(dt)
{
	var t = getTime() * 0.001;

	//example of how to blend two animations
	//animations.idle.assignTime( t, true );
	//animations.walking.assignTime( t, true );
	//RD.Skeleton.blend( animations.idle, animations.walking, 0.5, skeleton );

	var anim = animations[ character.anim_name ];
	if(anim && anim.duration)
	{
		anim.assignTime( t, true );
		character.assignSkeleton( anim.skeleton );
		character.shader = "texture_skinning";
		character.skeleton = anim.skeleton; //this could be useful
	}

	//input
	if(freecam)
	{
		//free camera
		var delta = [0,0,0];
		if( gl.keys["W"] )
			delta[2] = -1;
		else if( gl.keys["S"] )
			delta[2] = 1;
		if( gl.keys["A"] )
			delta[0] = -1;
		else if( gl.keys["D"] )
			delta[0] = 1;
		camera.moveLocal(delta,dt * 10);
	}
	else
		userMovement( character, dt );

	//example of ray test from the character with the environment (layer 0b1)
	if(0)
	{
		var center = character.localToGlobal([0,70,0]);
		var forward = character.getLocalVector([0,0,1]);
		vec3.normalize( forward, forward );
		var ray = new GL.Ray(center,forward);
		var coll_node = scene.testRay( ray,null,100,1 );
		if(coll_node)
			sphere.position = ray.collision_point;
	}

	//example of placing object in head of character
	if(0 && character.skeleton)
	{
		var head_matrix = character.skeleton.getBoneMatrix("mixamorig_Head", true);
		var gm = character.getGlobalMatrix();
		var m = mat4.create();
		mat4.multiply( m, gm, head_matrix );
		mat4.scale( m, m, [20,20,20]);
		sphere.fromMatrix( m );
	}

}

function userMovement( character, dt )
{
	var delta = [0,0,0];
	if( gl.keys["W"] )
		delta[2] = 1;
	else if( gl.keys["S"] )
		delta[2] = -1;
	vec3.scale( delta, delta, dt * 5 );
	var is_moving = vec3.length(delta);
	if(is_moving) //if moving
	{
		character.moveLocal( delta );
		character.anim_name = "walking";
		character.dance = false;
	}
	else
		character.anim_name = character.dance ? "dancing" : "idle";

	if( gl.keys["A"] )
		character.rotate(dt*1.5,[0,1,0]);
	else if( gl.keys["D"] )
		character.rotate(dt*-1.5,[0,1,0]);

	character.position = walk_area.adjustPosition( character.position );
}

function onMouse(e)
{
	//console.log(e);

	if(e.type == "mousedown")
	{
		var ray = camera.getRay( e.canvasx, e.canvasy );
		var coll_node = scene.testRay(ray);
		if(coll_node)
		{
			console.log(coll_node.name, ray.collision_point);
			if( coll_node.is_character ) //if character clicked
			{
				//...
			}
		}
	}

	if(e.dragging)
	{
		//camera.orbit(e.deltax * 0.01, [0,1,0] );
		//var right = camera.getLocalVector([1,0,0]);
		//camera.orbit(e.deltay * 0.01,right );

		//rotating camera
		camera.rotate(e.deltax * -0.01, [0,1,0] );
		var right = camera.getLocalVector([1,0,0]);
		camera.rotate(e.deltay * -0.01,right );
	}
}

function onKey(e)
{
	//console.log(e);
	if(e.key == "Tab")
	{
		freecam = !freecam;
		e.preventDefault();
		e.stopPropagation();
		return true;
	}
	else if(e.code == "Space")
		character.dance = !character.dance;
}


//last stores timestamp from previous frame
var last = performance.now();

function loop()
{
   draw();


   //to compute seconds since last loop
   var now = performance.now();
   //compute difference and convert to seconds
   var elapsed_time = (now - last) / 1000; 
   //store current time into last time
   last = now;

   //now we can execute our update method
   update( elapsed_time );

   //request to call loop() again before next frame
   requestAnimationFrame( loop );
}


function init()
{
	//start loop
	loop();
}

init();


/*
var canvas2D = document.createElement("canvas");
canvas2D.width = 512;
canvas2D.height = 512;
//document.body.appendChild( canvas2D );
var tex_canvas = null;
function updateCanvas2D()
{
	var ctx = canvas2D.getContext("2d");
	ctx.fillStyle = "red";
	ctx.fillRect(0,0,canvas2D.width, canvas2D.height );
	ctx.fillStyle = "blue";
	ctx.save();
	ctx.translate(canvas2D.width * 0.5,canvas2D.height * 0.5);
	ctx.rotate( getTime() * 0.001 );
	ctx.fillRect(-50,-50,100,100);
	ctx.restore();

	if(!tex_canvas)
		gl.textures["canvas_texture"] = tex_canvas = GL.Texture.fromImage(canvas2D);
	else
		tex_canvas.uploadImage(canvas2D);
}
*/

/*
var video = document.createElement("video");
video.src = "../disney.mp4";
video.autoplay = true;
video.volume = 0.1;
video.oncanplay = function(){
	document.body.appendChild( video );
}
*/