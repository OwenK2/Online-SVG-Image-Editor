class SVG {
	constructor(w, h) {
		this.elem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this.elem.setAttributeNS('http://www.w3.org/2000/svg', 'version', '1.1');
		this.elem.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		this.elem.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		this.elem.setAttributeNS('http://www.w3.org/2000/svg', 'viewBox', '0 0 ' + w + ' ' + h);

		this.wrapper = document.createElement('div');
		this.wrapper.className = 'svg_wrapper';
		this.wrapper.style.width = w + 'px';
		this.wrapper.style.height = h + 'px';

		this.wrapper.appendChild(this.elem);
		editor_area.appendChild(this.wrapper);

		this.w = w;
		this.h = h;
		this.position = {x: 0, y: 0};
		this.scale = 1;
		this.sp = this.ss = null;
		this.update_code();
	}

	//Transforming
	transform() {
		var snapped_scale = snap_value(this.scale, [1], .1);
		this.wrapper.style.transform = "translate(calc(-50% + "+this.position.x+"px), calc(-50% + "+this.position.y+"px)) scale("+snapped_scale+")";
	}
	reset_transform() {
		var self = this;
		this.wrapper.style.transition = "transform .3s";
		this.position = {x: 0, y: 0};
		this.scale = 1;
		this.transform();
		setTimeout(function() {self.wrapper.style.transition = "none";}, 300);
	}
	translate(x, y) {
		this.position.x += event.clientX - this.sp.x;
		this.position.y += event.clientY - this.sp.y;
		this.sp = {x: event.clientX, y: event.clientY};
		this.transform();
	}

	// Utility
	update_code() {
		if(this.elem) {
			editor.setValue(style_html('<?xml version="1.0" encoding="UTF-8"?>\n' + this.elem.outerHTML, {'indent_size': 1,'indent_char': '\t','max_char': Infinity,'brace_style': 'expand'}), -1);
		}
		else {
			editor.setValue('', -1);
		}
	}
	to_svg_space(x, y) {
		let bb = this.elem.getBoundingClientRect();
		return {
			x: (x - bb.left) / this.scale, 
			y: (y - bb.top) / this.scale
		};
	}
	delete() {
		this.wrapper.remove();
	}

}