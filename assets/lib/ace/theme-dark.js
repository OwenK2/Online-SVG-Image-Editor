ace.define("ace/theme/dark", ["require", "exports", "module", "ace/lib/dom"], function(a, n, e) {
	n.isDark = true; 
	n.cssClass = "ace-dark";
	n.cssText = `
		.ace-dark .ace_gutter {
			background: #0D1017;
			color: rgb(123,123,116)
		}

		.ace-dark .ace_print-margin {
			width: 1px;
			background: #e8e8e8
		}

		.ace-dark {
			background-color: #0D1017;
			color: #E6E1CF
		}

		.ace-dark .ace_cursor {
			color: #AAD94C
		}

		.ace-dark .ace_marker-layer .ace_selection {
			background: #253340
		}

		.ace-dark.ace_multiselect .ace_selection.ace_start {
			box-shadow: 0 0 3px 0px #0D1017;
			border-radius: 2px
		}

		.ace-dark .ace_marker-layer .ace_step {
			background: rgb(198, 219, 174)
		}

		.ace-dark .ace_marker-layer .ace_bracket {
			margin: 0px -1px;
			padding: 0 1px;
			border: 1px solid #FF7733
		}

		.ace-dark .ace_marker-layer .ace_active-line {
			background: #151A1F
		}

		.ace-dark .ace_gutter-active-line {
			background-color: #151A1F
		}

		.ace-dark .ace_marker-layer .ace_selected-word {
			border: 1px solid #253340
		}

		.ace-dark .ace_fold {
			background-color: #FFB454;
			border-color: #E6E1CF
		}

		.ace-dark .ace_keyword.ace_operator {
		colorcolor: #F29668
		}

		.ace-dark .ace_constant.ace_language {
			color: #FFEE99
		}

		.ace-dark .ace_constant.ace_numeric {
			color: #FFB454
		}

		.ace-dark .ace_constant.ace_character {
			color: #FFEE99
		}

		.ace-dark .ace_constant.ace_character.ace_escape {
			color: #95E6CB
		}

		.ace-dark .ace_constant.ace_other {
			color: #FFEE99
		}

		.ace-dark .ace_support.ace_function {
			color: #FFB454
		}

		.ace-dark .ace_support.ace_constant {
			font-style: italic;
			color: #F29668
		}

		.ace-dark .ace_support.ace_class {
			font-style: italic;
			color: #39BAE6
		}

		.ace-dark .ace_support.ace_type {
			font-style: italic;
			color: #39BAE6
		}

		.ace-dark .ace_storage {
			color: #FF7733
		}

		.ace-dark .ace_storage.ace_type {
			color: #FF7733
		}

		.ace-dark .ace_invalid {
			color: #FF3333
		}

		.ace-dark .ace_invalid.ace_deprecated {
			color: #FFFFFF;
			background-color: #FF7733
		}

		.ace-dark .ace_string {
			color: #AAD94C
		}

		.ace-dark .ace_string.ace_regexp {
			color: #95E6CB
		}

		.ace-dark .ace_comment {
			font-style: italic;
			color: #5C6773
		}

		.ace-dark .ace_variable {
			color: #E6E1CF
		}

		.ace-dark .ace_variable.ace_language {
			font-style: italic;
			color: #39BAE6
		}

		.ace-dark .ace_variable.ace_parameter {
			color: #FFEE99
		}

		.ace-dark .ace_entity.ace_other.ace_attribute-name {
			color: #FFB454
		}

		.ace-dark .ace_entity.ace_name.ace_function {
			color: #FFB454
		}
		.ace-dark .ace_support.ace_function.ace_dom {
			color: #F07178
		}
		.ace-dark .ace_entity.ace_name.ace_tag, .ace-dark .ace_tag.ace_tag-name.ace_xml {
			color: #39BAE6
		}
		.ace-dark .ace_keyword {
			color: #FF7733
		}
		.ace-dark .ace_php_tag {
			color: #E6B673
		}
		.ace-dark .ace_indent-guide {
			margin-right:-1px;
			border-right:1px dotted rgba(255,255,255,.2);
		}
		`;
	a("../lib/dom").importCssString(n.cssText, n.cssClass);
});