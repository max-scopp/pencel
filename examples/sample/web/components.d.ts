// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToyMDo1Mi4wNTVaIiwiZTNiMGM0NDI5OGZjMWMxNDlhZmJmNGM4OTk2ZmI5MjQyN2FlNDFlNDY0OWI5MzRjYTQ5NTk5MWI3ODUyYjg1NSJd
declare interface Document {
	createElement(
		tagName: "button",
		options: {
			is: "wb-button";
		},
	): HTMLPenButtonElement;
}
declare interface HTMLButtonElement {
	setAttribute(name: "is", value: "wb-button"): void;
}
declare interface Document {
	createElement(
		tagName: "details",
		options: {
			is: "wb-details";
		},
	): HTMLPenDetailsElement;
}
declare interface HTMLDetailsElement {
	setAttribute(name: "is", value: "wb-details"): void;
}
