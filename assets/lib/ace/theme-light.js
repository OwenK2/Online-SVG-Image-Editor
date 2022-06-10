ace.define("ace/theme/light",["require","exports","module","ace/lib/dom"],function(a,n,e){
	n.isDark = false;
	n.cssClass = "ace-light";
	n.cssText = `
		.ace-light .ace_gutter {
			background: #FEFEFE;
			color: rgb(180,184,189)
		}
		
		.ace-light .ace_print-margin {
			width: 1px;
			background: #e8e8e8
		}
		
		.ace-light {
			background-color: #FEFEFE;
			color: #6E7580
		}
		
		.ace-light .ace_cursor {
			color: #98C43C
		}
		
		.ace-light .ace_marker-layer .ace_selection {
			background: #F0EEE4
		}
		
		.ace-light.ace_multiselect .ace_selection.ace_start {
			box-shadow: 0 0 3px 0px #FEFEFE;
			border-radius: 2px
		}
		
		.ace-light .ace_marker-layer .ace_step {
			background: rgb(198, 219, 174)
		}
		
		.ace-light .ace_marker-layer .ace_bracket {
			margin: 0px -1px;
			padding: 0 1px;
			border: 1px solid #FA6E32
		}
		
		.ace-light .ace_marker-layer .ace_active-line {
			background: #F2F2F2
		}
		
		.ace-light .ace_gutter-active-line {
			background-color: #F2F2F2
		}
		
		.ace-light .ace_marker-layer .ace_selected-word {
			border: 1px solid #F0EEE4
		}
		
		.ace-light .ace_fold {
			background-color: #F29718;
			border-color: #6E7580
		}
		
		.ace-light .ace_keyword.ace_operator {
			color: #ED9366
		}
		
		.ace-light .ace_constant.ace_language {
			color: #A37ACC
		}
		
		.ace-light .ace_constant.ace_numeric {
			color: #A37ACC
		}
		
		.ace-light .ace_constant.ace_character {
			color: #A37ACC
		}
		
		.ace-light .ace_constant.ace_character.ace_escape {
			color: #4CBF99
		}
		
		.ace-light .ace_constant.ace_other {
			color: #A37ACC
		}
		
		.ace-light .ace_support.ace_function {
			color: #F29718
		}
		.ace-light .ace_support.ace_function.ace_dom {
			color: #F07171
		}
		
		.ace-light .ace_support.ace_constant {
			font-style: italic;
			color: #ED9366
		}
		
		.ace-light .ace_support.ace_class {
			font-style: italic;
			color: #55B4D4
		}
		
		.ace-light .ace_support.ace_type {
			font-style: italic;
			color: #55B4D4
		}
		
		.ace-light .ace_storage {
			color: #FA6E32
		}
		
		.ace-light .ace_storage.ace_type {
			color: #FA6E32
		}
		
		.ace-light .ace_invalid {
			color: #F51818
		}
		
		.ace-light .ace_invalid.ace_deprecated {
			color: #FFFFFF;
			background-color: #FA6E32
		}
		
		.ace-light .ace_string {
			color: #98C43C
		}
		
		.ace-light .ace_string.ace_regexp {
			color: #4CBF99
		}
		
		.ace-light .ace_comment {
			font-style: italic;
			color: #ABB0B6
		}
		
		.ace-light .ace_variable {
			color: #6E7580
		}
		
		.ace-light .ace_variable.ace_language {
			font-style: italic;
			color: #55B4D4
		}
		
		.ace-light .ace_variable.ace_parameter {
			color: #A37ACC
		}
		
		.ace-light .ace_entity.ace_other.ace_attribute-name {
			color: #F29718
		}
		
		.ace-light .ace_entity.ace_name.ace_function {
			color: #F29718
		}
		
		.ace-light .ace_entity.ace_name.ace_tag, .ace-light .ace_tag.ace_tag-name.ace_xml  {
			color: #55B4D4
		}
		.ace-light .ace_keyword {
			color: #FA6E32
		}
		.ace-light .ace_php_tag {
			color: #E6BA7E
		}
		.ace-light .ace_indent-guide {
			border-right:1px dotted rgba(255,255,255,.2);
			margin-right:-1px;
		}
	`;
	a("../lib/dom").importCssString(n.cssText, n.cssClass);
});