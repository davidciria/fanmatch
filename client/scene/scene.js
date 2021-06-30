/*Each scene represents one room where you can see TV with your friends.*/
function Scene(sceneJSON){
    this.json_scene = sceneJSON; //JSON object loaded.
    this.scene = new RD.Scene();
    this.walk_area = new WalkArea();
    this.CHARACTERS_LAYER = 4; //4 is 100 in binary.
    this.OBJECTS_LAYER = 3; //4 is 100 in binary.
    this.characters = {};
    this.objects = [];

    this.exportJSON = function(){
        var sceneObj = {
            "scene": {
                "characters": [],
                "objects": [],
                "walk_area": {
                    "shapes": []
                }
            }
        };

        Object.entries(this.characters).forEach(([name, c]) => {
            var charObj = {
                "name": c.name,
                "scale": c._scale[0],
                "mesh": c.mesh,
                "texture": c.texture,
                "anim_name": c.anim_name 
            }
            sceneObj.scene.characters.push(charObj);
        });

        this.objects.forEach(o => {
            var objObj = {
                "name": o.name,
                "scale": o._scale[0],
                "mesh": o.mesh,
                "layers": o.layers,
                "color": o.color, 
                "textures_color": o.textures.color,
                "position": o.position,
                "flags": Object.keys(o.flags).filter(x => !["visible", "collides", "was_rendered"].includes(x))
            }
            sceneObj.scene.objects.push(objObj);
        });

        sceneObj.scene.walk_area.shapes = this.walk_area.areas;

        return JSON.stringify(sceneObj);
    }
    
    this.getCharacters = function(){
        if(this.json_scene != null){
            this.json_scene.scene.characters.forEach(char => {
                var character = new RD.SceneNode();
                character.name = char.name;
                character.layers = this.CHARACTERS_LAYER;
                character.is_character = true;
                character.scale(char.scale);
                character.mesh = char.mesh;
                character.texture = char.texture;
                character.anim_name = char.anim_name;
                character.prev_anim_name = char.anim_name;
                character.variable = 0;
                if(char.position) character.position = char.position;
                if(char.rotation) character.rotation = char.rotation;
                character.controls = char.controls;
                character.b_skeleton = new RD.Skeleton();
                
                this.characters[ character.name ] = character;
                this.scene.root.addChild( character );
            });
        }else{
            console.error("JSON not loaded");
        }
    }

    this.getObjects = function(){
        if(this.json_scene != null){
            this.json_scene.scene.objects.forEach(obj => {
                var object = new RD.SceneNode();
                if(obj.color != undefined) object.color = obj.color;
                object.name = obj.name;
                object.layers = obj.layers ?? this.OBJECTS_LAYER;
                object.mesh = obj.mesh;
                
                if(obj.scale != undefined){
                    object.scale(obj.scale);
                }
                if(obj.textures_color != undefined) object.textures.color = obj.textures_color;
                
                obj.flags?.forEach(flag => {
                    object.flags[flag] = true;
                });
                if(obj.position != undefined){
                    object.position = obj.position;
                }
                
                this.objects.push( object );
                this.scene.root.addChild( object );
            });
        }else{
            console.error("JSON not loaded");
        }
    }

    this.getWalkAreas = function(){
        if(this.json_scene != null){
            this.json_scene.scene.walk_area.shapes.forEach(shape => {
                //this.walk_area.addRect(wa.init_point, wa.width, wa.depth);
                this.walk_area.addShape(shape);
                
            });
        }else{
            console.error("JSON not loaded");
        }
    }

    // Init scene
    this.getCharacters();
    this.getObjects();
    this.getWalkAreas();

    //Actions.
    this.addCharacter = function(characterJSON){

        var character = new RD.SceneNode();
        character.name = characterJSON.name;
        character.layers = this.CHARACTERS_LAYER;
        character.is_character = true;
        character.scale(characterJSON.scale);
        character.mesh = characterJSON.mesh;
        character.texture = characterJSON.texture;
        character.anim_name = characterJSON.anim_name;
        character.prev_anim_name = characterJSON.anim_name;
        character.variable = 0;
        character.controls = characterJSON.controls;
        character.b_skeleton = new RD.Skeleton();
        
        this.characters[ character.name ] = character;
        this.scene.root.addChild( character );

        serverClient.broadcastPosition(this.characters[localStorage["username"]].position, this.characters[localStorage["username"]].rotation);

    }

    this.removeCharacter = function(username){
        this.scene.root.removeChild( this.characters[username] );
        delete this.characters[username];
    }

    this.updateCharacterPosition = function(username, position, rotation){
        this.characters[username].position = position;
        this.characters[username].rotation = rotation;
    }

    this.updateCharacterControls = function(username, key, pressed){
        this.characters[username].controls[key] = pressed;
    }
}