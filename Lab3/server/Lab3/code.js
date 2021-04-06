//setup context
var canvas = document.querySelector("canvas");
var gl = GL.create({canvas: canvas});
var freecam = false;

gl.captureMouse();
gl.captureKeys();
gl.onmouse = onMouse;
gl.onkeydown = onKey;

//scene container
var scene = new RD.Scene();

var walk_area = new WalkArea();
//walk_area.addRect([-2,0.1,-1],4,2);
//walk_area.addRect([-2,0.1,-2],30,4);

if(RD.SceneNode)
	RD.SceneNode.prototype.assignSkeleton = function( skeleton )
	{
		this.skeleton = skeleton;
		var mesh = gl.meshes[ this.mesh ];
		if(!mesh)
			return;
		this.bones = skeleton.computeFinalBoneMatrices( this.bones, mesh );
		this.uniforms.u_bones = this.bones;
	}

var character = new RD.SceneNode();
character.position = [0,0,0];
character.scale(0.01);
character.mesh = "data/girl.wbin";
character.texture = "data/girl.png";
scene.root.addChild( character );

var sphere = new RD.SceneNode();
sphere.mesh = "sphere";
sphere.scale(0.2);
//scene.root.addChild( sphere );

var floor_node = new RD.SceneNode();
floor_node.color = [0.7,0.7,0.7,1];
floor_node.name = "floor";
floor_node.mesh = "planeXZ";
floor_node.scale(10);
floor_node.textures.color = "data/grid.png";
//scene.root.addChild( floor_node );

var room_node = new RD.SceneNode();
room_node.name = "room";
room_node.mesh = "data/room.obj";
//room_node.scale(10);
room_node.textures.color = "data/room.png";
scene.root.addChild( room_node );

//camera
var camera = new RD.Camera();
camera.lookAt([0,1.5,4],[0,1,0],[0,1,0]); //to set eye,center and up
camera.fov = 60;

//renderer of the scene
var renderer = new RD.Renderer(gl);

//animations container
var animations = {};

animations.idle = new RD.SkeletalAnimation();
animations.idle.load("data/anims/girl_idle.skanim");

animations.walking = new RD.SkeletalAnimation();
animations.walking.load("data/anims/girl_walking.skanim");

animations.dancing = new RD.SkeletalAnimation();
animations.dancing.load("data/anims/girl_dancing.skanim");

//skeleton for blending
var skeleton = new RD.Skeleton();


function draw()
{
	if(!freecam)
		camera.lookAt( camera.position, character.localToGlobal([0,1,0]), [0,1,0] );

	var time = performance.now();
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	camera.perspective(camera.fov,canvas.width / canvas.height,0.1,1000); //to render in perspective mode

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor( 0,0,0,1 );
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	renderer.render( scene, camera );

	//render gizmos
	//areas
	var vertices = walk_area.getVertices();
	if(vertices)
		renderer.renderPoints(vertices,null,camera,null,null,0.1,gl.LINES);

	gl.disable( gl.DEPTH_TEST );
	/* skeleton
	var vertices = skeleton.getVertices( character.getGlobalMatrix() );
	if(vertices)
		renderer.renderPoints(vertices,null,camera,null,null,0.1,gl.LINES);
	*/
	gl.enable( gl.DEPTH_TEST );
}

var anim_speed = 1;
var weight = 0;

//CONTROLLER
function update(dt)
{
		var t = getTime() * 0.001 * anim_speed;

		//walking_anim.assignTime( t, true );
		//skeleton.copyFrom( idle_anim.skeleton );
		//RD.Skeleton.blend( idle_anim.skeleton, walking_anim.skeleton, Math.sin(t) * 0.5 + 0.5, skeleton );

		var anim = animations[ character.anim_name ];
		if(anim && anim.duration)
		{
			anim.assignTime( t, true );
			character.assignSkeleton( anim.skeleton );
			character.shader = "texture_skinning";
		}

		/*
		skeleton.updateGlobalMatrices();
		var head_matrix = skeleton.getBoneMatrix("mixamorig_Head", true);
		var gm = character.getGlobalMatrix();
		var m = mat4.create();
		mat4.multiply( m, gm, head_matrix );
		mat4.scale( m, m, [20,20,20]);
		sphere.fromMatrix( m );
		*/


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

}

function userMovement( character, dt )
{
	var delta = [0,0,0];
	if( gl.keys["W"] )
		delta[2] = 1;
	else if( gl.keys["S"] )
		delta[2] = -1;
	vec3.scale( delta, delta, dt * 5 );
	delta = character.getLocalVector( delta );
	var is_moving = vec3.length(delta);
	if(is_moving) //if moving
	{
		character.translate( delta );
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
			console.log(coll_node.name, ray.collision_point);
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

