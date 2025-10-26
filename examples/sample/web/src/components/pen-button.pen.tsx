// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToyMDo1MS42ODBaIiwiNmI3ODVkMWMxYjBmMGNhYzNmZDMwMmI4MDRjZjBiOTAwYTA5NTg0OWIyZTFiZjk2M2VkOWJiYTJjZjUwNDA0NCJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToyMDozMC4zNTNaIiwiNjEwOGNhZGQxMDMwYTQxNzJiYTM4YTU4YjMwMGM5MDcwMjUzMjc3OTI5NDJiZmJjYzc2OGM0Nzk2MWYyYTJiNSJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToyMDoxNi40NDdaIiwiMzY0YjhkYjU5NmI3ODllNjcxODhmMzdjN2Y2MGIzNWQxY2NmMjE1ZDRlMTYyMzZiMGJkZmNkYTZlODM2MjQzYyJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToxOTozNi45MTNaIiwiMTZhZWE1YTAzMzljZDgyZmFiNWMxY2FhMWQ5MzQ2MzkxMzg0ODM5OGYzODNhNTA0NWFjYTVkYjUzOGY2M2M3ZSJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToxODoxNS4xMDFaIiwiOWJmMTMyNzk3ZDMzNGRhZjlmYjA2MGU5YjBmZDY0MDhkZWUzYzc2MmFiY2RjMzlmOTZkM2UzNmQ0MTNmOGViYiJd
// WyJHZW5lcmF0ZWQgYnkgUGVuY2VsIiwiMjAyNS0xMC0yNlQyMToxNjowOC45MTVaIiwiYzBmMzJmYzU1NTYwYTk4OTIxZTkyMjMyMjkxODVkMDVhYTUwZWE2NTUwZTJjNTdhMzM4YTQ2ZmQ3YjhhODJmYyJd
import {
	Component,
	type ComponentInterface,
	Host,
	type VNode,
} from "@pencel/runtime";
@Component({
	tag: "wb-button",
	extends: "HTMLButtonElement",
	forIs: "button",
	styles: [],
	styleUrls: {},
})
class HTMLPenButtonElement
	extends HTMLButtonElement
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
