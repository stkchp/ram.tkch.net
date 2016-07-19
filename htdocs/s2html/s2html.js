'use strict';

document.addEventListener("DOMContentLoaded", function(eve){

	const re = /^li$/i;
	const re_inst_byte = /:\t([0-9a-f ]+)/i;
	const re_data_byte = /:\t([0-9a-f ]{47})/i;
	const re_ws = / /g;

	for(let section of document.querySelectorAll('.section')) {
		// section size add to title
		let n_section = section;
		let section_size = 0;
		while(n_section = n_section.nextSibling) {
			if(re.exec(n_section.tagName) == null)
				continue;
			if(n_section.classList && n_section.classList.contains('section'))
				break;

			if(n_section.classList && n_section.classList.contains('data')) {
				const m = re_data_byte.exec(n_section.innerHTML);
				if(m != null) {
					section_size += m[1].replace(re_ws, '').length;
				}
			}
			if(n_section.classList && n_section.classList.contains('instruction')) {
				const m = re_inst_byte.exec(n_section.innerHTML);
				if(m != null) {
					section_size += m[1].replace(re_ws, '').length;
				}
			}
		};
		section.innerHTML += ` ${section_size}byte used.`;

		// clock to change section background color
		section.addEventListener("click", function() {
			for (let active of document.querySelectorAll('.active')) {
				active.classList.remove('active');
			}
			this.classList.add('active');

			let re = /^li$/i;
			let n_section = this.nextSibling;
			while(n_section = n_section.nextSibling) {
				if(re.exec(n_section.tagName) == null)
					continue;
				if(n_section.classList && n_section.classList.contains('section'))
					break;
				n_section.classList.add('active');
			}
		});
	}
});
