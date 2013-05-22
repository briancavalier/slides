define(['js!highlightjs!exports=hljs'], function(hljs) {
	return function(text, lang) {
		var result;

		try {
			result = hljs.highlight(lang, text);
		} catch(e) {
			result = hljs.highlightAuto(text);
		}

		return result ? hljs.fixMarkup(result.value, '  ') : text;

	};
})