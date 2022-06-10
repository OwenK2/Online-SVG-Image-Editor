

class Point {
	constructor() {
		if(arguments.length === 1) {
			this.x = arguments[0].x;
			this.y = arguments[0].y;
		}
		else {
			this.x = arguments[0];
			this.y = arguments[1];	
		}
	}
}