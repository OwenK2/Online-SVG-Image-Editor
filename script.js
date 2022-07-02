const MAX_FILE_LENGTH = 20;

let file_name_elem, ace_elem, editor_area, editor, svg, tmp_tool;

let theme = 'dark';
let tool = 'click';
let mouse_down = false;
let selected = [];

window.addEventListener('load', function() {
	if('serviceWorker' in navigator) {
		navigator.serviceWorker.register('service_worker.js', {scope: '.'})
		.then(function (registration) {}, function (err) {
			console.error('PWA: ServiceWorker registration failed: ', err);
		});
	}

	editor_area = document.querySelector('.editor');
	file_name_elem = document.querySelector('.file_name > input');
	ace_elem = document.getElementById('ace');
	
	window.addEventListener('keydown', on_keydown);
	window.addEventListener('keyup', on_keyup);
	editor_area.addEventListener('wheel', on_wheel);
	editor_area.addEventListener('gesturestart', on_gesture_start);
	editor_area.addEventListener('gesturechange', on_gesture_change);
	editor_area.addEventListener('gestureend', on_gesture_end);
	editor_area.addEventListener('mousedown', on_mousedown);
	window.addEventListener('mousemove', on_mousemove);
	window.addEventListener('mouseup', on_mouseup); 
	

	setup_ace();
	let theme_listener = window.matchMedia("(prefers-color-scheme: dark)");
	theme_listener.addListener(function(e){set_theme(e.matches ? 'dark' : 'light')});
	set_theme(localStorage.getItem('theme') || (theme_listener.matches ? 'dark' : 'light'));
	resize_input(file_name_elem);
	new_svg();

	new ColorPicker();
});

// Event Listeners
function on_keydown(event) {
	if(event.key === '0' && (event.metaKey || event.ctrlKey)) {
		event.preventDefault();
		svg.reset_transform();
	}
	if(event.key === 'f' && (event.metaKey || event.ctrlKey)) {
		event.preventDefault();
	}
	if(event.key === 'Shift') {
		tmp_tool = tool;
		tool = 'grab';
		select_tool(tool);
	}
}
function on_keyup(event) {
	if(event.key === 'Shift' && tmp_tool) {
		tool = tmp_tool
		select_tool(tool);
		tmp_tool = false;
	}
}

// Editor Functions
function new_svg(w = 512, h = 512) {
	if(svg) {svg.delete();}
	svg = new SVG(w, h);
}
function select_tool(elem) {
	if(typeof elem === "string") {elem = document.getElementById('tool_' + elem);}
	elem.parentNode.querySelectorAll('.selected').forEach(function(e) {e.classList.remove('selected');});
	tool = elem.id.substring(5);
	elem.classList.add('selected');
	switch(tool) {
		case "click":
			editor_area.style.cursor = 'default';
		break;
		case "grab":
			editor_area.style.cursor = 'grab';
		break;
		default:
			editor_area.style.cursor = 'crosshair';
	}
}
function on_mousedown(event) {
	switch(tool) {
		case 'grab':
			editor_area.style.cursor = 'grabbing';
			svg.sp = {x: event.clientX, y: event.clientY};
			break;
		case 'line':
			let pt = svg.to_svg_space(event.clientX, event.clientY);
			selected = [new Line(svg.elem, new Point(pt), new Point(pt))];
			break;
	}
	mouse_down = true;
	on_mousemove(event);
}
function on_mousemove(event) {
	if(mouse_down) {
		switch(tool) {
			case 'grab':
				svg.translate(event.clientX, event.clientY);
				break;
			case 'line':
				selected[0].draw(event);
				break;
		}
	}
}
function on_mouseup(event) {
	if(mouse_down) {
		switch(tool) {
			case 'grab':
				editor_area.style.cursor = 'grab';
				break;
			case 'line':
				selected = [];
				svg.update_code();
				break;
		}
	}
	mouse_down = false;
}
function on_wheel(event) {
	event.preventDefault();
	event.stopPropagation();
	if(Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
		svg.scale += Math.abs(event.deltaX) / event.deltaX * svg.scale / 40;
	}
	else {
		svg.scale += -Math.abs(event.deltaY) / event.deltaY * svg.scale / 40;
	}
	svg.transform();
}
function on_gesture_start(event) {
	event.preventDefault();
	event.stopPropagation();
	svg.ss = svg.scale;
}
function on_gesture_change(event) {
	event.preventDefault();
	event.stopPropagation();
	if(svg.ss !== null) {
		svg.scale = svg.ss * event.scale;
		svg.transform();
	}
}
function on_gesture_end(event) {
	event.preventDefault();
	event.stopPropagation();
	svg.ss = svg.scale;
}


// UI Functions
function setup_ace() {
	editor = ace.edit(ace_elem);
	editor.setOptions({
		theme: 'ace/theme/'+theme,
		mode: "ace/mode/svg",
		wrap: true,
		behavioursEnabled: true,
		showInvisibles: false,
		displayIndentGuides: true,
		fontSize: "1em",
		fontFamily: "var(--monospace)",
		scrollPastEnd: true,
		useWorker: true,
		printMargin: false,
		tabSize: 4,
		useSoftTabs: false,
		readOnly: true,
	});
	// this.ace.on('change', function(d) {});
}
function toggle_theme() {
	if(theme === 'dark') {set_theme('light');}
	else {set_theme('dark');}
}
function set_theme(t) {
	theme = t;
	if(theme === 'dark') {
		editor.setTheme('ace/theme/dark');
		document.querySelector(':root').className = '';
	}
	else {
		editor.setTheme('ace/theme/light');
		document.querySelector(':root').className = 'light';
	}
	localStorage.setItem('theme', theme);
}
function filter(input, type) {
	var cursor = input.selectionStart;
	var len = input.value.length;
	switch(type) {
		case "int":
			input.value = input.value.replace(/[^0-9]/gi, "");
			break;
		case "num":
			input.value = input.value.replace(/[^0-9\.]/gi, "");
			break;
		case "required":
		case "file":
			input.value = input.value.replace(/[^a-z0-9 !_\-\^]/gi, "");
			if(input.value.length > MAX_FILE_LENGTH) {input.value = input.value.substring(0, MAX_FILE_LENGTH);}
			if(type === "required" && input.value.trim().length === 0) {
				input.value = "Untitled";
			}
			input.value = input.value.trim();
			break;
	}
	if(type !== 'required') {
		var d = len - input.value.length;
		input.setSelectionRange(cursor-d+1, cursor-d);
	}
}
function resize_input(input) {
	input.style.width = measure_text(input).w + "px";
}
function toggle_code_view() {
	var elem = document.querySelector('.code');
	elem.classList.toggle('show');
}

// Utility Functions
function measure_text(input) {
	var tmp = document.createElement("span");
	var css = window.getComputedStyle(input);
	tmp.className = "hidden";
	tmp.style.fontFamily = css.getPropertyValue('font-family');
	tmp.style.fontWeight = css.getPropertyValue('font-weight');
	tmp.style.fontSize = css.getPropertyValue('font-size');
	tmp.style.margin = css.getPropertyValue('margin');
	tmp.style.padding = css.getPropertyValue('padding');
	tmp.innerHTML = input.value;
	document.body.appendChild(tmp);
	var w = tmp.getBoundingClientRect().width;
	var h = tmp.getBoundingClientRect().height;
	document.body.removeChild(tmp);
	return {w,h};
}
function copy_code(msg_target) {
    const type = "text/plain";
    const blob = new Blob([editor.getValue()], { type });
    const data = [new ClipboardItem({ [type]: blob })];
	navigator.clipboard.write(data).then(
		function () { /* success */
			fade_msg(msg_target, "Copied");
		},
		function () {/* failure */
			fade_msg(msg_target, "Failed to Copy", true);
		}
	);
}
function snap_value(value, snap_locations, tolerance = .1) {
	for(let i = 0; i < snap_locations.length; ++i) {
		if(value > snap_locations[i] - tolerance && value < snap_locations[i] + tolerance) {
			return snap_locations[i];
		}
	}
	return value;
}
function style_html(t,e){var n,i,r,s,a,_;for(i=(e=e||{}).indent_size||4,r=e.indent_char||" ",a=e.brace_style||"collapse",s=0==e.max_char?1/0:e.max_char||70,_=e.unformatted||["a","span","bdo","em","strong","dfn","code","samp","kbd","var","cite","abbr","acronym","q","sub","sup","tt","i","b","big","small","u","s","strike","font","ins","del","pre","address","dt","h1","h2","h3","h4","h5","h6"],(n=new function(){return this.pos=0,this.token="",this.current_mode="CONTENT",this.tags={parent:"parent1",parentcount:1,parent1:""},this.tag_type="",this.token_text=this.last_token=this.last_text=this.token_type="",this.Utils={whitespace:"\n\r\t ".split(""),single_token:"br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed,?php,?,?=".split(","),extra_liners:"head,body,/html".split(","),in_array:function(t,e){for(var n=0;n<e.length;n++)if(t===e[n])return!0;return!1}},this.get_content=function(){for(var t="",e=[],n=!1;"<"!==this.input.charAt(this.pos);){if(this.pos>=this.input.length)return e.length?e.join(""):["","TK_EOF"];if(t=this.input.charAt(this.pos),this.pos++,this.line_char_count++,this.Utils.in_array(t,this.Utils.whitespace))e.length&&(n=!0),this.line_char_count--;else{if(n){if(this.line_char_count>=this.max_char){e.push("\n");for(var i=0;i<this.indent_level;i++)e.push(this.indent_string);this.line_char_count=0}else e.push(" "),this.line_char_count++;n=!1}e.push(t)}}return e.length?e.join(""):""},this.get_contents_to=function(t){if(this.pos==this.input.length)return["","TK_EOF"];var e="",n=new RegExp("</"+t+"\\s*>","igm");n.lastIndex=this.pos;var i=n.exec(this.input),r=i?i.index:this.input.length;return this.pos<r&&(e=this.input.substring(this.pos,r),this.pos=r),e},this.record_tag=function(t){this.tags[t+"count"]?(this.tags[t+"count"]++,this.tags[t+this.tags[t+"count"]]=this.indent_level):(this.tags[t+"count"]=1,this.tags[t+this.tags[t+"count"]]=this.indent_level),this.tags[t+this.tags[t+"count"]+"parent"]=this.tags.parent,this.tags.parent=t+this.tags[t+"count"]},this.retrieve_tag=function(t){if(this.tags[t+"count"]){for(var e=this.tags.parent;e&&t+this.tags[t+"count"]!==e;)e=this.tags[e+"parent"];e&&(this.indent_level=this.tags[t+this.tags[t+"count"]],this.tags.parent=this.tags[e+"parent"]),delete this.tags[t+this.tags[t+"count"]+"parent"],delete this.tags[t+this.tags[t+"count"]],1==this.tags[t+"count"]?delete this.tags[t+"count"]:this.tags[t+"count"]--}},this.get_tag=function(){var t,e,n="",i=[],r=!1;do{if(this.pos>=this.input.length)return i.length?i.join(""):["","TK_EOF"];n=this.input.charAt(this.pos),this.pos++,this.line_char_count++,this.Utils.in_array(n,this.Utils.whitespace)?(r=!0,this.line_char_count--):("'"!==n&&'"'!==n||i[1]&&"!"===i[1]||(n+=this.get_unformatted(n),r=!0),"="===n&&(r=!1),i.length&&"="!==i[i.length-1]&&">"!==n&&r&&(this.line_char_count>=this.max_char?(this.print_newline(!1,i),this.line_char_count=0):(i.push(" "),this.line_char_count++),r=!1),"<"===n&&(t=this.pos-1),i.push(n))}while(">"!==n);var s,a=i.join("");s=-1!=a.indexOf(" ")?a.indexOf(" "):a.indexOf(">");var h=a.substring(1,s).toLowerCase();if("/"===a.charAt(a.length-2)||this.Utils.in_array(h,this.Utils.single_token))this.tag_type="SINGLE";else if("script"===h)this.record_tag(h),this.tag_type="SCRIPT";else if("style"===h)this.record_tag(h),this.tag_type="STYLE";else if(this.Utils.in_array(h,_)){var o=this.get_unformatted("</"+h+">",a);i.push(o),t>0&&this.Utils.in_array(this.input.charAt(t-1),this.Utils.whitespace)&&i.splice(0,0,this.input.charAt(t-1)),e=this.pos-1,this.Utils.in_array(this.input.charAt(e+1),this.Utils.whitespace)&&i.push(this.input.charAt(e+1)),this.tag_type="SINGLE"}else"!"===h.charAt(0)?-1!=h.indexOf("[if")?(-1!=a.indexOf("!IE")&&(o=this.get_unformatted("--\x3e",a),i.push(o)),this.tag_type="START"):-1!=h.indexOf("[endif")?(this.tag_type="END",this.unindent()):-1!=h.indexOf("[cdata[")?(o=this.get_unformatted("]]>",a),i.push(o),this.tag_type="SINGLE"):(o=this.get_unformatted("--\x3e",a),i.push(o),this.tag_type="SINGLE"):("/"===h.charAt(0)?(this.retrieve_tag(h.substring(1)),this.tag_type="END"):(this.record_tag(h),this.tag_type="START"),this.Utils.in_array(h,this.Utils.extra_liners)&&this.print_newline(!0,this.output));return i.join("")},this.get_unformatted=function(t,e){if(e&&-1!=e.indexOf(t))return"";var n="",i="",r=!0;do{if(this.pos>=this.input.length)return i;if(n=this.input.charAt(this.pos),this.pos++,this.Utils.in_array(n,this.Utils.whitespace)){if(!r){this.line_char_count--;continue}if("\n"===n||"\r"===n){i+="\n",this.line_char_count=0;continue}}i+=n,this.line_char_count++,r=!0}while(-1==i.indexOf(t));return i},this.get_token=function(){var t;if("TK_TAG_SCRIPT"===this.last_token||"TK_TAG_STYLE"===this.last_token){var e=this.last_token.substr(7);return"string"!=typeof(t=this.get_contents_to(e))?t:[t,"TK_"+e]}return"CONTENT"===this.current_mode?"string"!=typeof(t=this.get_content())?t:[t,"TK_CONTENT"]:"TAG"===this.current_mode?"string"!=typeof(t=this.get_tag())?t:[t,"TK_TAG_"+this.tag_type]:void 0},this.get_full_indent=function(t){return(t=this.indent_level+t||0)<1?"":Array(t+1).join(this.indent_string)},this.printer=function(t,e,n,i,r){this.input=t||"",this.output=[],this.indent_character=e,this.indent_string="",this.indent_size=n,this.brace_style=r,this.indent_level=0,this.max_char=i,this.line_char_count=0;for(var s=0;s<this.indent_size;s++)this.indent_string+=this.indent_character;this.print_newline=function(t,e){if(this.line_char_count=0,e&&e.length){if(!t)for(;this.Utils.in_array(e[e.length-1],this.Utils.whitespace);)e.pop();e.push("\n");for(var n=0;n<this.indent_level;n++)e.push(this.indent_string)}},this.print_token=function(t){this.output.push(t)},this.indent=function(){this.indent_level++},this.unindent=function(){this.indent_level>0&&this.indent_level--}},this}).printer(t,r,i,s,a);;){var h=n.get_token();if(n.token_text=h[0],n.token_type=h[1],"TK_EOF"===n.token_type)break;switch(n.token_type){case"TK_TAG_START":n.print_newline(!1,n.output),n.print_token(n.token_text),n.indent(),n.current_mode="CONTENT";break;case"TK_TAG_STYLE":case"TK_TAG_SCRIPT":n.print_newline(!1,n.output),n.print_token(n.token_text),n.current_mode="CONTENT";break;case"TK_TAG_END":if("TK_CONTENT"===n.last_token&&""===n.last_text){var o=n.token_text.match(/\w+/)[0],c=n.output[n.output.length-1].match(/<\s*(\w+)/);null!==c&&c[1]===o||n.print_newline(!0,n.output)}n.print_token(n.token_text),n.current_mode="CONTENT";break;case"TK_TAG_SINGLE":var u=n.token_text.match(/^\s*<([a-z]+)/i);u&&n.Utils.in_array(u[1],_)||n.print_newline(!1,n.output),n.print_token(n.token_text),n.current_mode="CONTENT";break;case"TK_CONTENT":""!==n.token_text&&n.print_token(n.token_text),n.current_mode="TAG";break;case"TK_STYLE":case"TK_SCRIPT":if(""!==n.token_text){n.output.push("\n");var l=n.token_text;if("TK_SCRIPT"==n.token_type)var p="function"==typeof js_beautify&&js_beautify;else if("TK_STYLE"==n.token_type)p="function"==typeof css_beautify&&css_beautify;if("keep"==e.indent_scripts)var f=0;else if("separate"==e.indent_scripts)f=-n.indent_level;else f=1;var T=n.get_full_indent(f);if(p)l=p(l.replace(/^\s*/,T),e);else{var d=l.match(/^\s*/)[0].match(/[^\n\r]*$/)[0].split(n.indent_string).length-1,E=n.get_full_indent(f-d);l=l.replace(/^\s*/,T).replace(/\r\n|\r|\n/g,"\n"+E).replace(/\s*$/,"")}l&&(n.print_token(l),n.print_newline(!0,n.output))}n.current_mode="TAG"}n.last_token=n.token_type,n.last_text=n.token_text}return n.output.join("")}function css_beautify(t,e){var n=(e=e||{}).indent_size||4,i=e.indent_char||" ";"string"==typeof n&&(n=parseInt(n));var r,s=/^\s+$/,a=-1;function _(){return r=t.charAt(++a)}function h(){return t.charAt(a+1)}function o(e){for(var n=a;_();)if("\\"==r)_(),_();else{if(r==e)break;if("\n"==r)break}return t.substring(n,a+1)}function c(){for(var t=a;s.test(h());)a++;return a!=t}function u(){var t=a;do{}while(s.test(_()));return a!=t+1}function l(){var e=a;for(_();_();)if("*"==r&&"/"==h()){a++;break}return t.substring(e,a+1)}var p=t.match(/^[\r\n]*[\t ]*/)[0],f=Array(n+1).join(i);var T,d,E={"{":function(t){E.singleSpace(),O.push(t),E.newLine()},"}":function(t){E.newLine(),O.push(t),E.newLine()},newLine:function(t){if(!t)for(;s.test(O[O.length-1]);)O.pop();O.length&&O.push("\n"),p&&O.push(p)},singleSpace:function(){O.length&&!s.test(O[O.length-1])&&O.push(" ")}},O=[];for(p&&O.push(p);;){var K=u();if(!r)break;"{"==r?(0,p+=f,E["{"](r)):"}"==r?(0,p=p.slice(0,-n),E["}"](r)):'"'==r||"'"==r?O.push(o(r)):";"==r?O.push(r,"\n",p):"/"==r&&"*"==h()?(E.newLine(),O.push(l(),"\n",p)):"("==r?(T="url",d=-1,O.slice(-T.length+(d||0),d).join("").toLowerCase()==T?(O.push(r),c(),_()&&(")"!=r&&'"'!=r&&"'"!=r?O.push(o(")")):a--)):(K&&E.singleSpace(),O.push(r),c())):")"==r?O.push(r):","==r?(c(),O.push(r),E.singleSpace()):"]"==r?O.push(r):"["==r||"="==r?(c(),O.push(r)):(K&&E.singleSpace(),O.push(r))}return O.join("").replace(/[\n ]+$/,"")}function js_beautify(t,e){var n,i,r,s,a,_,h,o,c,u,l,p,f,T,d,E,O,K,g,N,v,A,S,R="";void 0!==(e=e||{}).space_after_anon_function&&void 0===e.jslint_happy&&(e.jslint_happy=e.space_after_anon_function),void 0!==e.braces_on_own_line&&(S=e.braces_on_own_line?"expand":"collapse"),S=e.brace_style?e.brace_style:S||"collapse";var m=e.indent_size?e.indent_size:4,b=e.indent_char?e.indent_char:" ",C=void 0===e.preserve_newlines||e.preserve_newlines,k=void 0!==e.break_chained_methods&&e.break_chained_methods,y=void 0!==e.max_preserve_newlines&&e.max_preserve_newlines,x="undefined"!==e.jslint_happy&&e.jslint_happy,L=void 0!==e.keep_array_indentation&&e.keep_array_indentation,I=void 0===e.space_before_conditional||e.space_before_conditional,P=void 0!==e.unescape_strings&&e.unescape_strings;v=!1;var D,w=t.length;function M(t){for(t=void 0!==t&&t;i.length&&(" "===i[i.length-1]||i[i.length-1]===u||i[i.length-1]===R||t&&("\n"===i[i.length-1]||"\r"===i[i.length-1]));)i.pop()}function X(t){return t.replace(/^\s\s*|\s\s*$/,"")}function B(t){for(var e=[],n=(t=t.replace(/\x0d/g,"")).indexOf("\n");-1!==n;)e.push(t.substring(0,n)),n=(t=t.substring(n+1)).indexOf("\n");return t.length&&e.push(t),e}function U(t,e){if(o.eat_next_space=!1,(!L||!$(o.mode))&&(t=void 0===t||t,(e=void 0===e||e)&&(o.if_line=!1,o.chain_extra_indentation=0),M(),i.length)){"\n"===i[i.length-1]&&t||(v=!0,i.push("\n")),R&&i.push(R);for(var n=0;n<o.indentation_level+o.chain_extra_indentation;n+=1)i.push(u);o.var_line&&o.var_line_reindented&&i.push(u)}}function j(){if("TK_COMMENT"===s)return U();if(o.eat_next_space)o.eat_next_space=!1;else{var t=" ";i.length&&(t=i[i.length-1])," "!==t&&"\n"!==t&&t!==u&&i.push(" ")}}function G(){v=!1,o.eat_next_space=!1,i.push(r)}function W(){o.indentation_level+=1}function F(){i.length&&i[i.length-1]===u&&i.pop()}function z(t){o&&c.push(o),o={previous_mode:o?o.mode:"BLOCK",mode:t,var_line:!1,var_line_tainted:!1,var_line_reindented:!1,in_html_comment:!1,if_line:!1,chain_extra_indentation:0,in_case_statement:!1,in_case:!1,case_body:!1,eat_next_space:!1,indentation_level:o?o.indentation_level+(o.var_line&&o.var_line_reindented?1:0):0,ternary_depth:0}}function $(t){return"[EXPRESSION]"===t||"[INDENTED-EXPRESSION]"===t}function Q(t){return H(t,["[EXPRESSION]","(EXPRESSION)","(FOR-EXPRESSION)","(COND-EXPRESSION)"])}function Y(){if(g="DO_BLOCK"===o.mode,c.length>0){var t=o.mode;(o=c.pop()).previous_mode=t}}function J(t,e){for(var n=0;n<t.length;n++){if(X(t[n]).charAt(0)!==e)return!1}return!0}function q(t){return H(t,["case","return","do","if","throw","else"])}function H(t,e){for(var n=0;n<e.length;n+=1)if(e[n]===t)return!0;return!1}function V(t){for(var e=T,i=n.charAt(e);H(i,l)&&i!==t;){if(++e>=w)return 0;i=n.charAt(e)}return i}function Z(){var t,e;if(A=0,T>=w)return["","TK_EOF"];N=!1;var r=n.charAt(T);if(T+=1,L&&$(o.mode)){for(var _=0;H(r,l);){if("\n"===r?(M(),i.push("\n"),v=!0,_=0):"\t"===r?_+=4:"\r"===r||(_+=1),T>=w)return["","TK_EOF"];r=n.charAt(T),T+=1}if(v)for(t=0;t<_;t++)i.push(" ")}else{for(;H(r,l);){if("\n"===r&&(A+=y?A<=y?1:0:1),T>=w)return["","TK_EOF"];r=n.charAt(T),T+=1}if(C&&A>1)for(t=0;t<A;t+=1)U(0===t),v=!0;N=A>0}if(H(r,p)){if(T<w)for(;H(n.charAt(T),p)&&(r+=n.charAt(T),(T+=1)!==w););if(T!==w&&r.match(/^[0-9]+[Ee]$/)&&("-"===n.charAt(T)||"+"===n.charAt(T))){var h=n.charAt(T);return T+=1,[r+=h+Z()[0],"TK_WORD"]}return"in"===r?[r,"TK_OPERATOR"]:(!N||"TK_OPERATOR"===s||"TK_EQUALS"===s||o.if_line||!C&&"var"===a||U(),[r,"TK_WORD"])}if("("===r||"["===r)return[r,"TK_START_EXPR"];if(")"===r||"]"===r)return[r,"TK_END_EXPR"];if("{"===r)return[r,"TK_START_BLOCK"];if("}"===r)return[r,"TK_END_BLOCK"];if(";"===r)return[r,"TK_SEMICOLON"];if("/"===r){var c="",u=!0;if("*"===n.charAt(T)){if((T+=1)<w)for(;T<w&&("*"!==n.charAt(T)||!n.charAt(T+1)||"/"!==n.charAt(T+1))&&(c+=r=n.charAt(T),"\n"!==r&&"\r"!==r||(u=!1),!((T+=1)>=w)););return T+=2,u&&0===A?["/*"+c+"*/","TK_INLINE_COMMENT"]:["/*"+c+"*/","TK_BLOCK_COMMENT"]}if("/"===n.charAt(T)){for(c=r;"\r"!==n.charAt(T)&&"\n"!==n.charAt(T)&&(c+=n.charAt(T),!((T+=1)>=w)););return N&&U(),[c,"TK_COMMENT"]}}if("'"===r||'"'===r||"/"===r&&("TK_WORD"===s&&q(a)||")"===a&&H(o.previous_mode,["(COND-EXPRESSION)","(FOR-EXPRESSION)"])||"TK_COMMA"===s||"TK_COMMENT"===s||"TK_START_EXPR"===s||"TK_START_BLOCK"===s||"TK_END_BLOCK"===s||"TK_OPERATOR"===s||"TK_EQUALS"===s||"TK_EOF"===s||"TK_SEMICOLON"===s)){var d=r,O=!1,K=0,g=0;if(e=r,T<w)if("/"===d){for(var S=!1;O||S||n.charAt(T)!==d;)if(e+=n.charAt(T),O?O=!1:(O="\\"===n.charAt(T),"["===n.charAt(T)?S=!0:"]"===n.charAt(T)&&(S=!1)),(T+=1)>=w)return[e,"TK_STRING"]}else for(;O||n.charAt(T)!==d;)if(e+=n.charAt(T),K&&K>=g&&((K=parseInt(e.substr(-g),16))&&K>=32&&K<=126&&(K=String.fromCharCode(K),e=e.substr(0,e.length-g-2)+(K===d||"\\"===K?"\\":"")+K),K=0),K?K++:O?(O=!1,P&&("x"===n.charAt(T)?(K++,g=2):"u"===n.charAt(T)&&(K++,g=4))):O="\\"===n.charAt(T),(T+=1)>=w)return[e,"TK_STRING"];if(T+=1,e+=d,"/"===d)for(;T<w&&H(n.charAt(T),p);)e+=n.charAt(T),T+=1;return[e,"TK_STRING"]}if("#"===r){if(0===i.length&&"!"===n.charAt(T)){for(e=r;T<w&&"\n"!==r;)e+=r=n.charAt(T),T+=1;return i.push(X(e)+"\n"),U(),Z()}var R="#";if(T<w&&H(n.charAt(T),E)){do{R+=r=n.charAt(T),T+=1}while(T<w&&"#"!==r&&"="!==r);return"#"===r||("["===n.charAt(T)&&"]"===n.charAt(T+1)?(R+="[]",T+=2):"{"===n.charAt(T)&&"}"===n.charAt(T+1)&&(R+="{}",T+=2)),[R,"TK_WORD"]}}if("<"===r&&"\x3c!--"===n.substring(T-1,T+3)){for(T+=3,r="\x3c!--";"\n"!==n.charAt(T)&&T<w;)r+=n.charAt(T),T++;return o.in_html_comment=!0,[r,"TK_COMMENT"]}if("-"===r&&o.in_html_comment&&"--\x3e"===n.substring(T-1,T+2))return o.in_html_comment=!1,T+=2,N&&U(),["--\x3e","TK_COMMENT"];if("."===r)return[r,"TK_DOT"];if(H(r,f)){for(;T<w&&H(r+n.charAt(T),f)&&(r+=n.charAt(T),!((T+=1)>=w)););return","===r?[r,"TK_COMMA"]:"="===r?[r,"TK_EQUALS"]:[r,"TK_OPERATOR"]}return[r,"TK_UNKNOWN"]}for(u="";m>0;)u+=b,m-=1;for(;t&&(" "===t.charAt(0)||"\t"===t.charAt(0));)R+=t.charAt(0),t=t.substring(1);for(n=t,h="",s="TK_START_EXPR",a="",_="",i=[],g=!1,l="\n\r\t ".split(""),p="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$".split(""),E="0123456789".split(""),f="+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! !! , : ? ^ ^= |= ::",f=(f+=" <%= <% %> <?= <? ?>").split(" "),d="continue,try,throw,return,var,if,switch,case,default,for,while,break,function".split(","),c=[],z("BLOCK"),T=0;;){var tt=Z();if(r=tt[0],"TK_EOF"===(K=tt[1]))break;switch(K){case"TK_START_EXPR":if("["===r){if("TK_WORD"===s||")"===a){H(a,d)&&j(),z("(EXPRESSION)"),G();break}"[EXPRESSION]"===o.mode||"[INDENTED-EXPRESSION]"===o.mode?"]"===_&&","===a?("[EXPRESSION]"===o.mode&&(o.mode="[INDENTED-EXPRESSION]",L||W()),z("[EXPRESSION]"),L||U()):"["===a?("[EXPRESSION]"===o.mode&&(o.mode="[INDENTED-EXPRESSION]",L||W()),z("[EXPRESSION]"),L||U()):z("[EXPRESSION]"):z("[EXPRESSION]")}else"for"===h?z("(FOR-EXPRESSION)"):H(h,["if","while"])?z("(COND-EXPRESSION)"):z("(EXPRESSION)");";"===a||"TK_START_BLOCK"===s?U():"TK_END_EXPR"===s||"TK_START_EXPR"===s||"TK_END_BLOCK"===s||"."===a?N&&U():"TK_WORD"!==s&&"TK_OPERATOR"!==s?j():"function"===h||"typeof"===h?x&&j():(H(a,d)||"catch"===a)&&I&&j(),G();break;case"TK_DOT":q(a)?j():")"===a&&(k||N)&&(o.chain_extra_indentation=1,U(!0,!1)),G();break;case"TK_END_EXPR":if("]"===r)if(L){if("}"===a){F(),G(),Y();break}}else if("[INDENTED-EXPRESSION]"===o.mode&&"]"===a){Y(),U(),G();break}Y(),G();break;case"TK_START_BLOCK":if(z("do"===h?"DO_BLOCK":"BLOCK"),"expand"===S||"expand-strict"===S){var et=!1;"expand-strict"===S?(et="}"===V())||U(!0):"TK_OPERATOR"!==s&&("="===a||q(a)&&"else"!==a?j():U(!0)),G(),et||W()}else"TK_OPERATOR"!==s&&"TK_START_EXPR"!==s?"TK_START_BLOCK"===s?U():j():$(o.previous_mode)&&","===a&&("}"===_?j():U()),W(),G();break;case"TK_END_BLOCK":Y(),"expand"===S||"expand-strict"===S?("{"!==a&&U(),G()):("TK_START_BLOCK"===s?v?F():M():$(o.mode)&&L?(L=!1,U(),L=!0):U(),G());break;case"TK_WORD":if(g){j(),G(),j(),g=!1;break}if(O="NONE","function"===r){if(o.var_line&&"TK_EQUALS"!==s&&(o.var_line_reindented=!0),(v||";"===a)&&"{"!==a&&"TK_BLOCK_COMMENT"!==s&&"TK_COMMENT"!==s){A=v?A:0,C||(A=1);for(var nt=0;nt<2-A;nt++)U(!1)}"TK_WORD"===s?"get"===a||"set"===a||"new"===a||"return"===a?j():U():"TK_OPERATOR"===s||"="===a?j():Q(o.mode)||U(),G(),h=r;break}if("case"===r||"default"===r&&o.in_case_statement){U(),o.case_body&&(o.indentation_level--,o.case_body=!1,F()),G(),o.in_case=!0,o.in_case_statement=!0;break}"TK_END_BLOCK"===s?H(r.toLowerCase(),["else","catch","finally"])?"expand"===S||"end-expand"===S||"expand-strict"===S?O="NEWLINE":(O="SPACE",j()):O="NEWLINE":"TK_SEMICOLON"!==s||"BLOCK"!==o.mode&&"DO_BLOCK"!==o.mode?"TK_SEMICOLON"===s&&Q(o.mode)?O="SPACE":"TK_STRING"===s?O="NEWLINE":"TK_WORD"===s?("else"===a&&M(!0),O="SPACE"):"TK_START_BLOCK"===s?O="NEWLINE":"TK_END_EXPR"===s&&(j(),O="NEWLINE"):O="NEWLINE",H(r,d)&&")"!==a&&(O="else"===a?"SPACE":"NEWLINE"),o.if_line&&"TK_END_EXPR"===s&&(o.if_line=!1),H(r.toLowerCase(),["else","catch","finally"])?"TK_END_BLOCK"!==s||"expand"===S||"end-expand"===S||"expand-strict"===S?U():(M(!0),j()):"NEWLINE"===O?q(a)?j():"TK_END_EXPR"!==s?"TK_START_EXPR"===s&&"var"===r||":"===a||("if"===r&&"else"===h&&"{"!==a?j():(o.var_line=!1,o.var_line_reindented=!1,U())):H(r,d)&&")"!==a&&(o.var_line=!1,o.var_line_reindented=!1,U()):$(o.mode)&&","===a&&"}"===_?U():"SPACE"===O&&j(),G(),h=r,"var"===r&&(o.var_line=!0,o.var_line_reindented=!1,o.var_line_tainted=!1),"if"===r&&(o.if_line=!0),"else"===r&&(o.if_line=!1);break;case"TK_SEMICOLON":G(),o.var_line=!1,o.var_line_reindented=!1,"OBJECT"===o.mode&&(o.mode="BLOCK");break;case"TK_STRING":"TK_END_EXPR"===s&&H(o.previous_mode,["(COND-EXPRESSION)","(FOR-EXPRESSION)"])?j():"TK_COMMENT"===s||"TK_STRING"===s||"TK_START_BLOCK"===s||"TK_END_BLOCK"===s||"TK_SEMICOLON"===s?U():"TK_WORD"===s?j():C&&N&&(U(),i.push(u)),G();break;case"TK_EQUALS":o.var_line&&(o.var_line_tainted=!0),j(),G(),j();break;case"TK_COMMA":if(o.var_line){if((Q(o.mode)||"TK_END_BLOCK"===s)&&(o.var_line_tainted=!1),o.var_line_tainted){G(),o.var_line_reindented=!0,o.var_line_tainted=!1,U();break}o.var_line_tainted=!1,G(),j();break}"TK_COMMENT"===s&&U(),"TK_END_BLOCK"===s&&"(EXPRESSION)"!==o.mode?(G(),"OBJECT"===o.mode&&"}"===a?U():j()):"OBJECT"===o.mode?(G(),U()):(G(),j());break;case"TK_OPERATOR":var it=!0,rt=!0;if(q(a)){j(),G();break}if("*"===r&&"TK_DOT"===s&&!_.match(/^\d+$/)){G();break}if(":"===r&&o.in_case){o.case_body=!0,W(),G(),U(),o.in_case=!1;break}if("::"===r){G();break}H(r,["--","++","!"])||H(r,["-","+"])&&(H(s,["TK_START_BLOCK","TK_START_EXPR","TK_EQUALS","TK_OPERATOR"])||H(a,d)||","==a)?(it=!1,rt=!1,";"===a&&Q(o.mode)&&(it=!0),"TK_WORD"===s&&H(a,d)&&(it=!0),"BLOCK"!==o.mode||"{"!==a&&";"!==a||U()):":"===r?0===o.ternary_depth?("BLOCK"===o.mode&&(o.mode="OBJECT"),it=!1):o.ternary_depth-=1:"?"===r&&(o.ternary_depth+=1),it&&j(),G(),rt&&j();break;case"TK_BLOCK_COMMENT":var st,at=B(r);if(J(at.slice(1),"*"))for(U(),i.push(at[0]),st=1;st<at.length;st++)U(),i.push(" "),i.push(X(at[st]));else for(at.length>1?U():"TK_END_BLOCK"===s?U():j(),st=0;st<at.length;st++)i.push(at[st]),i.push("\n");"\n"!==V("\n")&&U();break;case"TK_INLINE_COMMENT":j(),G(),Q(o.mode)?j():(void 0,D=L,L=!1,U(),L=D);break;case"TK_COMMENT":","!==a||N||M(!0),"TK_COMMENT"!==s&&(N?U():j()),G(),U();break;case"TK_UNKNOWN":G()}_=a,s=K,a=r}return R+i.join("").replace(/[\r\n ]+$/,"")}"undefined"!=typeof exports&&(exports.css_beautify=css_beautify),"undefined"!=typeof exports&&(exports.js_beautify=js_beautify);var Beautifier={js:function(t){return js_beautify(t,{indent_size:4,space_before_conditional:!0,jslint_happy:!0,max_char:0})},html:function(t){return style_html(t,{indent_size:4,max_char:0})},css:function(t){return css_beautify(t,{indent_size:4,max_char:0})}};
function beautify_code() {
	editor.setValue(style_html(editor.getValue(), {'indent_size': 1,'indent_char': '\t','max_char': Infinity,'brace_style': 'expand'}), -1);
}
function minify_code() {
  editor.setValue(editor.getValue()
    .replace(/\>[\r\n ]+\</g, "><")
    .replace(/(<.*?>)|\s+/g, (m, $1) => $1 ? $1 : ' ')
    .trim(), -1);
}
function fade_msg(target, msg, error = false) {
	let e = document.createElement('div');
	let bb = target.getBoundingClientRect();
	e.className = error ? 'fade_msg error' : 'fade_msg';
	e.textContent = msg;
	e.style.top = bb.top - 10 + "px";
	e.style.left = bb.right - 10 + "px";
	document.body.appendChild(e);
	setTimeout(function() {
		e.classList.add('fade');
	}, 100);
	setTimeout(function() {
		e.remove();
	}, 2100);
}