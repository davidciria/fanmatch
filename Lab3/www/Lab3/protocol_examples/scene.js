function Scene(path){
    this.path = path;
    this.json_scene = null; //JSON object loaded.
    this.scene = new RD.Scene();
    this.walk_area = new WalkArea();
    this.CHARACTERS_LAYER = 4; //4 is 100 in binary.
    this.characters = [];
    this.objects = [];

    this.loadJSON = async function(){
        var result = await makeRequest("GET", this.path); //Get JSON info.
        this.json_scene = JSON.parse(result);
        console.log("JSON Recieved");
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
                object.name = obj.name;
                object.layers = obj.layers;
                if(obj.scale != null) object.scale(obj.scale);
                object.mesh = obj.mesh;
                object.color =  obj.color ?? delete object.color;
                object.textures.color = obj.textures_color;
                
                obj.flags?.forEach(flag => {
                    object.flags[flag] = true;
                });
                
                this.objects.push( object );
                this.scene.root.addChild( object );
            });
        }else{
            console.error("JSON not loaded");
        }
    }

    this.getWalkAreas = function(){
        if(this.json_scene != null){
            this.json_scene.scene.walk_area.forEach(wa => {
                this.walk_area.addRect(wa.init_point, wa.width, wa.depth);
            });
        }else{
            console.error("JSON not loaded");
        }
    }

    this.initScene = async function(){
        await this.loadJSON(); //Load json.
        console.log(this.json_scene);
        this.getCharacters();
        this.getObjects();
        this.getWalkAreas();
        console.log(this.scene.root);
    }
}

// async function main(){
//     var sceneObj = new Scene();
//     await sceneObj.loadJSON(); //Load json.
//     console.log(sceneObj.json_scene);
//     sceneObj.getCharacters();
//     sceneObj.getObjects();
//     sceneObj.getWalkAreas();
//     console.log(sceneObj.scene.root);
// }
var sceneObj = new Scene("./scene.json");
sceneObj.initScene().then(res =>{
    console.log("Done");
});