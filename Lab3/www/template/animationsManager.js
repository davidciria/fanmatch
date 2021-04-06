function AnimationsManager(){
    this.animations = {}; //animations container

    this.loadAnimation = function( name, url ){
		var anim = new RD.SkeletalAnimation();
		anim.load(url);
		this.animations[ name ] = anim;
	}
}