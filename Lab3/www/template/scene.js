//Each scene represents one room where you can see TV with your friends.
function Scene(sceneJSON){
    this.json_scene = sceneJSON; //JSON object loaded.
    this.scene = new RD.Scene();
    this.walk_area = new WalkArea();
    this.CHARACTERS_LAYER = 4; //4 is 100 in binary.
    this.OBJECTS_LAYER = 3; //4 is 100 in binary.
    this.characters = [];
    this.objects = [];

    // this.loadJSON = async function(){
    //     var result = await makeRequest("GET", this.path); //Get JSON info.
    //     this.json_scene = JSON.parse(result);
    //     console.log("JSON Recieved");
    // }

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

        this.characters.forEach(c => {
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
                
                this.characters.push( character );
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
}