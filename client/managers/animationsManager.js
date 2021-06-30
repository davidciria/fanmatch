/*Class to handle characters animations*/
function AnimationsManager(){
    this.animations = {};

    this.loadAnimation = function( name, url ){
		var anim = new RD.SkeletalAnimation();
		anim.load(url);
		this.animations[ name ] = anim;
	}
}