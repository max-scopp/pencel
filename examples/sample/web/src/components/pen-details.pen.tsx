// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToyMDo1MS45OTFaIiwiYzg5YWNmODA1ZDYyMWUxY2JlMGE1ODE4OTgwMzM0OWYwNDBiYmJhZjY5ZDVjNGU1MzhlYmFlNTNiZDljNTNjNiJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToyMDozMC41OTBaIiwiMmM1NTk4Mjc2MmFkNDJlMGU3YjIxN2JlNWZlZjA3ZTVlYTg1NGE1OTBjNDdmMjgzODRiN2YxN2UwYzJjNTVlOSJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToyMDoxNi42ODlaIiwiNzU4YTU4MTVlNzg2NzRhYTBhNjM2ZjY2ZGRjYzcyYmU1NGRiNDM0ZWFlNGUxY2Y3NjNiNDcyZDA0N2NiN2UxOSJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToxOTozNy4yMTJaIiwiZTYzYTkwY2FjOTNiMzYwMzc3NGU5NmMzOTllYjkwYjU5ZDkxY2EyNGM2OTZlODc0NDZkNzM5ZTc4NmMyZDVjZCJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToxODoxNS4zNTBaIiwiYzk1OTE4MGJhN2UzNjNlNTk2ZjI0ZGMzOTI3NDA0OTQxYWZmNDQ4NWRkZjM1NTZhOTljOWZiNzk3YTUxMzcwMCJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToxNjowOS4xNDhaIiwiNDMwNThhNDU4OGUzM2VjNDY1OTcwYWYyOTMwNDEzOTk5ZTdkYmYyZjY5M2E3NmVlMzMwNWVlMGYzYWU3MTM0ZiJd
import {
	Component,
	type ComponentInterface,
	Host,
	type VNode,
} from "@pencel/runtime";
@Component({
	tag: "wb-details",
	extends: "HTMLDetailsElement",
	forIs: "details",
	styles: [],
	styleUrls: {},
})
class HTMLPenDetailsElement
	extends HTMLDetailsElement
	implements ComponentInterface
{
	render(): VNode {
		return (
			<Host>
				<slot />
			</Host>
		);
	}
}
