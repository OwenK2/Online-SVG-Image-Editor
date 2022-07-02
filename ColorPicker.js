class ColorPicker {
	constructor(color = "rgba(255,0,0,1)", x = 100, y = 100) {
		ColorPicker.instances.push(this);
		this.format = 'HEX';
		this.dragging = false;
		this.picking = false;
		this.position = {x, y};
		this.padding = 15;
		this.last_mouse = {x: 0, y: 0};



		this.elem = document.createElement('div');
		this.elem.className = 'color_picker';
		this.elem.style.left = x + "px";
		this.elem.style.top = y + "px";
		this.elem.addEventListener('contextmenu', function(event) {event.preventDefault(); return false;});
		this.elem.innerHTML = `
		<div class="color_picker_head">
			<svg onclick="" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 47.971 47.971" ><path d="M28.228,23.986L47.092,5.122c1.172-1.171,1.172-3.071,0-4.242c-1.172-1.172-3.07-1.172-4.242,0L23.986,19.744L5.121,0.88   c-1.172-1.172-3.07-1.172-4.242,0c-1.172,1.171-1.172,3.071,0,4.242l18.865,18.864L0.879,42.85c-1.172,1.171-1.172,3.071,0,4.242   C1.465,47.677,2.233,47.97,3,47.97s1.535-0.293,2.121-0.879l18.865-18.864L42.85,47.091c0.586,0.586,1.354,0.879,2.121,0.879   s1.535-0.293,2.121-0.879c1.172-1.171,1.172-3.071,0-4.242L28.228,23.986z"/></svg>
		</div>
		<div class="color_picker_pickers">
			<div>
				<div class="color_picker_marker"></div>
			</div>
			<div>
				<div class="color_picker_marker"></div>
			</div>
			<div>
				<div class="color_picker_marker"></div>
			</div>
		</div>
		<div class="color_picker_info">
			<div class="color_picker_preview" onclick="this.children[0].click();">
				<input class="color_picker_preview_input" type="color" />
			</div>
			<div style="position:relative;">
				<select class="color_picker_format">
					<option>HEX</option>
					<option>RGB</option>
					<option>HSL</option>
					<option>HSV</option>
				</select>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path stroke-linejoin="round" stroke-width="4" d="m32.02 2.01 14 23.8h-28zM32.5 61.8 18.5 38h28z"/></svg>
			</div>
			<div style="position:relative;">
				<input class="color_picker_input" type="text" />
				<svg class="color_picker_add_swatch_btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 469.33333 469.33333"><path d="M437.33203 192h-160V32c0-17.66406-14.33594-32-32-32H224c-17.66406 0-32 14.33594-32 32v160H32c-17.66406 0-32 14.33594-32 32v21.33203c0 17.66406 14.33594 32 32 32h160v160c0 17.66406 14.33594 32 32 32h21.33203c17.66406 0 32-14.33594 32-32v-160h160c17.66406 0 32-14.33594 32-32V224c0-17.66406-14.33594-32-32-32zm0 0"/></svg>
			</div>
		</div>
		<div class="color_picker_swatches"></div>`;
		document.body.appendChild(this.elem);
		let self = this;
		this.head_elem = this.elem.querySelector('.color_picker_head');
		this.head_elem.addEventListener('mousedown', function(event) {self.on_mousedown(event);});
		this.close_btn = this.elem.querySelector('.color_picker_head > svg');
		this.close_btn.addEventListener('mousedown', function(event) {event.stopPropagation();self.close();})
		this.sv_palette = this.elem.querySelector('.color_picker_pickers > div:first-child');
		this.sv_palette.addEventListener('mousedown', function(event) {self.picking = self.sv_palette.firstElementChild;self.on_mousemove(event);});
		this.hue_palette = this.elem.querySelector('.color_picker_pickers > div:nth-child(2)');
		this.hue_palette.addEventListener('mousedown', function(event) {self.picking = self.hue_palette.firstElementChild;self.on_mousemove(event);});
		this.alpha_palette = this.elem.querySelector('.color_picker_pickers > div:last-child');
		this.alpha_palette.addEventListener('mousedown', function(event) {self.picking = self.alpha_palette.firstElementChild;self.on_mousemove(event);});
		this.format_elem = this.elem.querySelector('.color_picker_format');
		this.format_elem.value = this.format;
		this.format_elem.addEventListener('input', function(event) {self.set_format(event);});
		this.input = this.elem.querySelector('.color_picker_input');
		this.preview = this.elem.querySelector('.color_picker_preview');
		this.preview_input = this.elem.querySelector('.color_picker_preview_input');
		this.preview_input.addEventListener('input', function(event) {self.set_color(this.value, true);})
		this.swatch_elem = this.elem.querySelector('.color_picker_swatches');
		this.add_swatch_btn = this.elem.querySelector('.color_picker_add_swatch_btn');
		this.add_swatch_btn.addEventListener('click', function() {ColorPicker.add_swatch(self.color.toRgbString());});

		this.resize_listener = function(event) {self.on_resize(event);}
		window.addEventListener('resize', this.resize_listener);
		this.mousemove_listener = function(event) {self.on_mousemove(event);}
		window.addEventListener('mousemove', this.mousemove_listener);
		this.mouseup_listener = function(event) {self.on_mouseup(event);}
		window.addEventListener('mouseup', this.mouseup_listener);

		this.set_color(color);
		this.update_swatch_elems();
	}
	set_color(color, preserve_alpha = false) {
		let c = tinycolor(color);
		if(c.isValid()) {
			if(preserve_alpha) {c.setAlpha(this.color.getAlpha());}
			let hsv = c.toHsv();
			this.sv_palette.firstElementChild.style.top = ((1 - hsv.v) * 100) + "%";
			this.sv_palette.firstElementChild.style.left = (hsv.s * 100) + "%";
			this.hue_palette.firstElementChild.style.top = (hsv.h / 360 * 100) + "%";
			this.alpha_palette.firstElementChild.style.top = ((1 - c.getAlpha()) * 100) + "%";
			this.color = c;
			this.update_ui();
		}
	}
	update_ui() {
		let hsv = this.color.toHsv();
		let rgb = this.color.toRgbString();
		let hue = tinycolor({h:hsv.h, s: 1, v: 1}).toRgbString();
		this.sv_palette.style.background = 'linear-gradient(0deg, rgba(0,0,0,255) 0%, rgba(0,0,0,0) 100%), linear-gradient(90deg, rgba(255,255,255,255) 0%, rgba(0,0,0,0) 100%), linear-gradient(0deg, ' + hue + ' 0%, ' + hue + ' 100%)';
		this.alpha_palette.style.background = 'linear-gradient(180deg, ' + this.color.toHexString() + ' 0%, rgba(0,0,0,0) 100%), var(--transparent-img) center/20px';
		this.preview.style.background = rgb;
		this.preview_input.value = this.color.toHexString();
		this.set_text_input();
	}
	set_format() {
		this.format = this.format_elem.value;
		this.set_text_input();
	}
	set_text_input() {
		this.input.classList.add('nothex');
		switch(this.format) {
			case 'HEX': 
				this.input.value = this.color.getAlpha() !== 1 ? this.color.toHex8String() : this.color.toHexString();
				this.input.classList.remove('nothex');
				break;
			case 'RGB': 
				this.input.value = this.color.toRgbString();
				break;
			case 'HSL': 
				this.input.value = this.color.toHslString();
				break;
			case 'HSV': 
				this.input.value = this.color.toHsvString();
				break;
		}
	}
	update_swatch_elems() {
		var self = this;
		this.swatch_elem.innerHTML = '';
		ColorPicker.swatches.forEach(function(color) {
			let elem = document.createElement('div');
			elem.className = 'swatch';
			elem.style.backgroundColor = color;
			elem.dataset.color = color;
			elem.addEventListener('click', function(event) {
				if(event.button === 0) {
					self.set_color(this.dataset.color);
				}
				else if(event.button === 2) {
					ColorPicker.remove_swatch(this.dataset.color);
				}
			});
			elem.addEventListener('contextmenu', function(event) {
				ColorPicker.remove_swatch(this.dataset.color);
			});
			self.swatch_elem.appendChild(elem);
		});
	}


	on_resize(event) {
		this.update_position();
	}
	on_mousedown(event) {
		if(!this.picking && event.button === 0) {
			this.dragging = true;
			this.elem.classList.add('dragging');
			this.last_mouse.x = event.clientX;
			this.last_mouse.y = event.clientY;
		}
	}
	on_mouseup(event) {
		if(this.dragging) {
			this.dragging = false;
			this.elem.classList.remove('dragging');
		}
		this.picking = false;
	}
	on_mousemove(event) {
		if(this.dragging) {
			this.position.x += event.clientX - this.last_mouse.x;
			this.position.y += event.clientY - this.last_mouse.y;
			this.last_mouse.x = event.clientX;
			this.last_mouse.y = event.clientY;
			this.update_position();
		}
		else if(this.picking) {
			let bb = this.picking.parentNode.getBoundingClientRect();
			let x = event.clientX - bb.x;
			let y = event.clientY - bb.y;
			if(x < 0) {x = 0;}
			else if(x > bb.width) {x = bb.width;}
			if(y < 0) {y = 0;}
			else if(y > bb.height) {y = bb.height;}
			if(!event.shiftKey || this.picking.parentNode !== this.sv_palette) {this.picking.style.left = x + "px";}
			if(!event.altKey || this.picking.parentNode !== this.sv_palette) {this.picking.style.top = y + "px";}
			this.color = tinycolor({
				h: this.hue_palette.firstElementChild.offsetTop / this.hue_palette.offsetHeight * 360,
				s: this.sv_palette.firstElementChild.offsetLeft / this.sv_palette.offsetWidth,
				v: (1 - (this.sv_palette.firstElementChild.offsetTop / this.sv_palette.offsetHeight)),
				a: (1 - (this.alpha_palette.firstElementChild.offsetTop / this.alpha_palette.offsetHeight)),
			});
			this.update_ui();
		}
	}
	update_position() {
		if(this.position.x < this.padding) {
			this.position.x = this.padding;
		}
		else if(this.position.x > window.innerWidth - this.padding - this.head_elem.offsetWidth) {
			this.position.x = window.innerWidth - this.padding  - this.head_elem.offsetWidth;
		}
		if(this.position.y < this.padding) {
			this.position.y = this.padding;
		}
		else if(this.position.y > window.innerHeight - this.padding  - this.head_elem.offsetHeight) {
			this.position.y = window.innerHeight - this.padding  - this.head_elem.offsetHeight;
		}
		this.elem.style.left = this.position.x + "px";
		this.elem.style.top = this.position.y + "px";
	}

	open() {
		this.elem.classList.add('show');
	}
	toggle() {
		this.elem.classList.toggle('show');
	}
	close() {
		this.elem.classList.remove('show');
	}
	remove() {
		let i = ColorPicker.instances.indexOf(this);
		if(i > -1) {ColorPicker.instances.splice(i, 1);}
		window.removeEventListener('resize', this.resize_listener);
		window.removeEventListener('mousemove', this.mousemove_listener);
		window.removeEventListener('mouseup', this.mouseup_listener);
		this.elem.remove();
	}
}
ColorPicker.instances = [];
ColorPicker.swatches = JSON.parse(localStorage.getItem('__swatches')) || [];
ColorPicker.add_swatch = function(color) {
	if(ColorPicker.swatches.indexOf(color) === -1) {
		ColorPicker.swatches.push(color);
		ColorPicker.instances.forEach(function(picker) {
			picker.update_swatch_elems();
		});
		localStorage.setItem('__swatches', JSON.stringify(ColorPicker.swatches));
	}
}
ColorPicker.remove_swatch = function(color) {
	let i = ColorPicker.swatches.indexOf(color);
	if(i > -1) {
		ColorPicker.swatches.splice(i, 1);
		ColorPicker.instances.forEach(function(picker) {
			picker.update_swatch_elems();
		});
		localStorage.setItem('__swatches', JSON.stringify(ColorPicker.swatches));
	}
}