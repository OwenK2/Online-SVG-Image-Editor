class Line {
	constructor(parent, pt1, pt2) {
		this.elem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		this.parent = parent;
		this.pts = [pt1, pt2];
		this.parent.appendChild(this.elem);
		this.render();
	}
	draw(event) {
		let pt = svg.to_svg_space(event.clientX, event.clientY);
		this.pts[1].x = pt.x;
		this.pts[1].y = pt.y;
		this.render();
	}
	render() {
		this.elem.setAttribute('x1', this.pts[0].x);
		this.elem.setAttribute('y1', this.pts[0].y);
		this.elem.setAttribute('x2', this.pts[1].x);
		this.elem.setAttribute('y2', this.pts[1].y);
	}
}