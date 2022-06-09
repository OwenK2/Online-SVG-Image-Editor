ace.define("ace/theme/default", ["require", "exports", "module", "ace/lib/dom"], function(a, n, e) {
	n.isDark = true; 
	n.cssClass = "ace-default";
	n.cssText = `
		.ace-default .ace_gutter {
			background: #0D1017;
			color: rgb(123,123,116)
		}

		.ace-default .ace_print-margin {
			width: 1px;
			background: #e8e8e8
		}

		.ace-default {
			background-color: #0D1017;
			color: #E6E1CF
		}

		.ace-default .ace_cursor {
			color: #AAD94C
		}

		.ace-default .ace_marker-layer .ace_selection {
			background: #253340
		}

		.ace-default.ace_multiselect .ace_selection.ace_start {
			box-shadow: 0 0 3px 0px #0D1017;
			border-radius: 2px
		}

		.ace-default .ace_marker-layer .ace_step {
			background: rgb(198, 219, 174)
		}

		.ace-default .ace_marker-layer .ace_bracket {
			margin: 0px -1px;
			padding: 0 1px;
			border: 1px solid #FF7733
		}

		.ace-default .ace_marker-layer .ace_active-line {
			background: #151A1F
		}

		.ace-default .ace_gutter-active-line {
			background-color: #151A1F
		}

		.ace-default .ace_marker-layer .ace_selected-word {
			border: 1px solid #253340
		}

		.ace-default .ace_fold {
			background-color: #FFB454;
			border-color: #E6E1CF
		}

		.ace-default .ace_keyword.ace_operator {
		colorcolor: #F29668
		}

		.ace-default .ace_constant.ace_language {
			color: #FFEE99
		}

		.ace-default .ace_constant.ace_numeric {
			color: #FFB454
		}

		.ace-default .ace_constant.ace_character {
			color: #FFEE99
		}

		.ace-default .ace_constant.ace_character.ace_escape {
			color: #95E6CB
		}

		.ace-default .ace_constant.ace_other {
			color: #FFEE99
		}

		.ace-default .ace_support.ace_function {
			color: #FFB454
		}

		.ace-default .ace_support.ace_constant {
			font-style: italic;
			color: #F29668
		}

		.ace-default .ace_support.ace_class {
			font-style: italic;
			color: #39BAE6
		}

		.ace-default .ace_support.ace_type {
			font-style: italic;
			color: #39BAE6
		}

		.ace-default .ace_storage {
			color: #FF7733
		}

		.ace-default .ace_storage.ace_type {
			color: #FF7733
		}

		.ace-default .ace_invalid {
			color: #FF3333
		}

		.ace-default .ace_invalid.ace_deprecated {
			color: #FFFFFF;
			background-color: #FF7733
		}

		.ace-default .ace_string {
			color: #AAD94C
		}

		.ace-default .ace_string.ace_regexp {
			color: #95E6CB
		}

		.ace-default .ace_comment {
			font-style: italic;
			color: #5C6773
		}

		.ace-default .ace_variable {
			color: #E6E1CF
		}

		.ace-default .ace_variable.ace_language {
			font-style: italic;
			color: #39BAE6
		}

		.ace-default .ace_variable.ace_parameter {
			color: #FFEE99
		}

		.ace-default .ace_entity.ace_other.ace_attribute-name {
			color: #FFB454
		}

		.ace-default .ace_entity.ace_name.ace_function {
			color: #FFB454
		}
		.ace-default .ace_support.ace_function.ace_dom {
			color: #F07178
		}
		.ace-default .ace_entity.ace_name.ace_tag, .ace-default .ace_tag.ace_tag-name.ace_xml {
			color: #39BAE6
		}
		.ace-default .ace_keyword {
			color: #FF7733
		}
		.ace-default .ace_php_tag {
			color: #E6B673
		}
		.ace-default .ace_indent-guide {
			margin-right:-1px;
			border-right:1px dotted rgba(255,255,255,.2);
		}
		`;
	a("../lib/dom").importCssString(n.cssText, n.cssClass);
});