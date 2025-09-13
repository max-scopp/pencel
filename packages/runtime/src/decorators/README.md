# Component API
The whole API provided by stencil can be condensed in a set of decorators, lifecycles hooks and rendering methods.

ää Decorators
Decorators are a pure compiler-time construction used by stencil to collect all the metadata about a component, the properties, attributes and methods it might expose, the events it might emit or even the associated stylesheets. Once all the metadata has been collected, all the decorators are removed from the output, so they don't incur any runtime overhead.

- [-] @Component() declares a new web component
- [x] @Prop() declares an exposed property/attribute
- [x] @State() declares an internal state of the component
- [ ] @Watch() declares a hook that runs when a property or state changes
- [ ] @Element() declares a reference to the host element
- [ ] @Method() declares an exposed public method
- [ ] @Event() declares a DOM event the component might emit
- [ ] @Listen() listens for DOM events
- [ ] Lifecycle hooks
- [ ] connectedCallback()
- [ ] disconnectedCallback()
- [ ] componentWillLoad()
- [ ] componentDidLoad()
- [ ] componentShouldUpdate(newValue, oldValue, propName): boolean
- [ ] componentWillRender()
- [ ] componentDidRender()
- [ ] componentWillUpdate()
- [ ] componentDidUpdate()
- [ ] render()
- [ ] componentOnReady()

This isn't a true "lifecycle" method that would be declared on the component class definition, but instead is a utility method that can be used by an implementation consuming your Stencil component to detect when a component has finished its first render cycle.

This method returns a promise which resolves after componentDidRender() on the first render cycle.


Executing code after componentOnReady() resolves could look something like this:

// Get a reference to the element
const el = document.querySelector('my-component');

el.componentOnReady().then(() => {
  // Place any code in here you want to execute when the component is ready
  console.log('my-component is ready');
});

The availability of componentOnReady() depends on the component's compiled output type. This method is only available for lazy-loaded distribution types (dist and www) and, as such, is not available for dist-custom-elements output. If you want to simulate the behavior of componentOnReady() for non-lazy builds, you can implement a helper method to wrap the functionality similar to what the Ionic Framework does here.

