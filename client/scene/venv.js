/*Function that initializes and draws the main scene (room we have logged in)*/
//Our Scene
var sceneObj;
var venv_page = document.querySelector("#venv_page");

//Room settings.
var preview_room_texture = document.querySelector("#preview_room_texture");
var save_room_texture = document.querySelector("#save_room_texture");
var carousel_roomTextures = document.querySelector("#carouselExampleInterval");

preview_room_texture.addEventListener("click", function(){
	var active_slide = carousel_roomTextures.querySelector(".active");
	var texture_selected_img = active_slide.querySelector("img");

	sceneObj.objects.find(o => o.name == "room").textures.color = texture_selected_img.src;
});

save_room_texture.addEventListener("click", function(){
	var active_slide = carousel_roomTextures.querySelector(".active");
	var texture_selected_img = active_slide.querySelector("img");

	serverClient.changeRoomTexture(texture_selected_img.src);
});

function initScene(sceneJSON) {
	var username = localStorage.getItem("username");
	sceneObj = new Scene(sceneJSON);

	var smart_tv = new RD.SceneNode();
	smart_tv.mesh = "data/room.obj";
	smart_tv.position = [0, 8, 0];
	smart_tv.textures.color = "black";
	smart_tv.scale(0.5);
	sceneObj.scene.root.addChild(smart_tv);

	var television = new RD.SceneNode();
	television.color = [0.7,0.7,0.7,1];
	television.mesh = "plane";
	television.flags.two_sided = true;
	television.scale([2, 1, 1]);
	television.position = [0, 1, -3.9];
	television.textures.color = "canvas_texture";
	sceneObj.scene.root.addChild(television);
	var fullscreenTv = false;

	var videoExample = document.createElement("video");
	videoExample.src = "./data/video_example.mp4"
	videoExample.autoplay = true;

	//setup context
	var canvas = document.querySelector("canvas");
	var gl = GL.create({ canvas: canvas });

	
	var text_videoExample = GL.Texture.fromImage(videoExample);
	gl.textures["canvas_texture"] = text_videoExample;

	gl.captureMouse();
	gl.captureKeys();
	gl.onkeydown = onKeyDown;
	gl.onkeyup = onKeyUp;

	var scene = sceneObj.scene;
	var character = sceneObj.characters[username];
	var sphere = sceneObj.objects[2];

	var walk_area = sceneObj.walk_area;

	//camera
	var camera = new RD.Camera();
	camera.lookAt([0, 1.5, 4], [0, 1, 0], [0, 1, 0]); //to set eye,center and up
	camera.fov = 60;

	//renderer of the scene
	var renderer = new RD.Renderer(gl);

	var animManager = new AnimationsManager();

	animManager.loadAnimation("idle", "data/anims/idle_gen.skanim");
	animManager.loadAnimation("walking", "data/anims/walking_gen.skanim");
	animManager.loadAnimation("dancing", "data/anims/celebration_gen.skanim");

	//we need an skeletonm if we plan to do blending
	var skeleton = new RD.Skeleton(); //skeleton for blending

	//draws the whole frame
	function draw() {
		camera.lookAt(camera.position, character.localToGlobal([0, 2, 0]), [0, 1, 0]);
		
		canvas.width = venv_page.offsetWidth;
		canvas.height = venv_page.offsetHeight;
		camera.perspective(camera.fov, canvas.width / canvas.height, 0.1, 1000); //to render in perspective mode

		//clear
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		drawWorld(camera);

		if (fullscreenTv){
			text_videoExample.toViewport();		
		}
	}

	//draws the world from a camera point of view
	function drawWorld(camera) {
		renderer.render(scene, camera);
	}

	//controller.
	character.variable = 0;
	character.prev_anim_name = character.anim_name;

	var t = 0;
	function update(dt) {

		if(text_videoExample) text_videoExample.uploadImage(videoExample); //Play video in the television.
		
		t += dt;

		animManager.animations.idle.assignTime(t, true);
		animManager.animations.walking.assignTime(t, true);

		Object.entries(sceneObj.characters).forEach(([name, c]) => {
			if(name != username){

				animManager.animations.idle.assignTime(t + c.name.length, true);
				animManager.animations.walking.assignTime(t + c.name.length, true);

				//example of how to blend two animations
				if (c.prev_anim_name == c.anim_name) {
					if (c.anim_name == 'idle') c.variable = 0;
					else c.variable = 1;
				} else {
					//Begin walking.
					if (c.prev_anim_name == 'idle') {
						c.variable += (dt * 1.5);
						if (c.variable > 1) c.prev_anim_name = c.anim_name;
					}
					// Stopping
					else {
						c.variable -= (dt * 3);
						if (c.variable < 0) c.prev_anim_name = c.anim_name;
					}
				}

				RD.Skeleton.blend(animManager.animations["idle"].skeleton, animManager.animations["walking"].skeleton, c.variable, c.b_skeleton);

				userMovement(c, dt);
				
				var anim = animManager.animations[c.anim_name];
				if (anim && anim.duration) {
					anim.assignTime(t + c.name.length, true);
					if (c.anim_name == 'dancing') {
						c.assignSkeleton(anim.skeleton);
					}
					else c.assignSkeleton(c.b_skeleton); //skeleton
					c.shader = "texture_skinning";
					c.skeleton = anim.skeleton; 
				}
			}
        });

		//example of how to blend two animations
		if (character.prev_anim_name == character.anim_name) {
			if (character.anim_name == 'idle') character.variable = 0;
			else character.variable = 1;
		} else {
			//Begin walking.
			if (character.prev_anim_name == 'idle') {
				character.variable += (dt * 1.5);
				if (character.variable > 1) character.prev_anim_name = character.anim_name;
			}
			// Stopping
			else {
				character.variable -= (dt * 3);
				if (character.variable < 0) character.prev_anim_name = character.anim_name;
			}
		}

		RD.Skeleton.blend(animManager.animations["idle"].skeleton, animManager.animations["walking"].skeleton, character.variable, skeleton);

		var anim = animManager.animations[character.anim_name];
		if (anim && anim.duration) {
			anim.assignTime(t, true);
			if (character.anim_name == 'dancing') {
				character.assignSkeleton(anim.skeleton);
			}
			else character.assignSkeleton(skeleton); 
			character.shader = "texture_skinning";
			character.skeleton = anim.skeleton; 
		}
 
		myUserMovement(character, dt);

		//example of ray test from the character with the environment (layer 0b1)
		if (0) {
			var center = character.localToGlobal([0, 70, 0]);
			var forward = character.getLocalVector([0, 0, 1]);
			vec3.normalize(forward, forward);
			var ray = new GL.Ray(center, forward);
			var coll_node = scene.testRay(ray, null, 100, 1);
			if (coll_node)
				sphere.position = ray.collision_point;
		}

	}

	function myUserMovement(character, dt) {
		var delta = [0, 0, 0];
		if (gl.keys["W"])
			delta[2] = 1;
		else if (gl.keys["S"])
			delta[2] = -1;
		vec3.scale(delta, delta, dt * 2);
		var is_moving = vec3.length(delta);

		if (is_moving)
		{
			character.moveLocal(delta);
			character.anim_name = "walking";
			character.dance = false;
		}
		else
			character.anim_name = character.dance ? "dancing" : "idle";

		if (gl.keys["A"]){
			character.rotate(dt * 1.5, [0, 1, 0]);
		}
		else if (gl.keys["D"]){
			character.rotate(dt * -1.5, [0, 1, 0]);
		}

		character.position = walk_area.adjustPosition(character.position);
	}

	function userMovement(character, dt) {
		var delta = [0, 0, 0];

		if(character.controls.space){
			character.dance = !character.dance;
			character.controls.space = !character.controls.space;
		}
		
		if (character.controls.w)
			delta[2] = 1;
		else if (character.controls.s)
			delta[2] = -1;
		vec3.scale(delta, delta, dt * 2);
		var is_moving = vec3.length(delta);

		if (is_moving) //if moving
		{
			character.moveLocal(delta);
			character.anim_name = "walking";
			character.dance = false;
		}
		else
			character.anim_name = character.dance ? "dancing" : "idle";

		if (character.controls.a){
			character.rotate(dt * 1.5, [0, 1, 0]);
		}
		else if (character.controls.d){
			character.rotate(dt * -1.5, [0, 1, 0]);
		}

		character.position = walk_area.adjustPosition(character.position);
	}

	function onKeyDown(e) {

		if (e.key == "v") {
			fullscreenTv = !fullscreenTv;	
		}else if (e.code == "Space") {
			character.dance = !character.dance;
			t = 0;
			var message = {
				type: "controls",
				content: {space: true}
			};
		}else if(e.key == "w"){
			var message = {
				type: "controls",
				content: {w: true}
			};
		}else if(e.key == "a"){
			var message = {
				type: "controls",
				content: {a: true}
			};
		}else if(e.key == "s"){
			var message = {
				type: "controls",
				content: {s: true}
			};
		}else if(e.key == "d"){
			var message = {
				type: "controls",
				content: {d: true}
			};
		}

		if(message){
			serverClient.broadcastControls(message);
			serverClient.broadcastPosition(character.position, character.rotation);
		}

	}

	function onKeyUp(e) {

		if(e.key == "w"){
			var message = {
				type: "controls",
				content: {w: false}
			};
		}else if(e.key == "a"){
			var message = {
				type: "controls",
				content: {a: false}
			};
		}else if(e.key == "s"){
			var message = {
				type: "controls",
				content: {s: false}
			};
		}else if(e.key == "d"){
			var message = {
				type: "controls",
				content: {d: false}
			};
		}

		if(message){
			serverClient.broadcastControls(message);
			serverClient.broadcastPosition(character.position, character.rotation);
		}

	}


	//last stores timestamp from previous frame
	var last = performance.now();

	function loop() {
		draw();

		//to compute seconds since last loop
		var now = performance.now();
		//compute difference and convert to seconds
		var elapsed_time = (now - last) / 1000;
		//store current time into last time
		last = now;

		//now we can execute our update method
		update(elapsed_time);

		//request to call loop() again before next frame
		requestAnimationFrame(loop);
	}


	function init() {
		//start loop
		loop();
	}

	init();

}

