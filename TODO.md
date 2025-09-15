# 🚧 Pencel TODO: Essential Design Library Functions

> **Target Frameworks**: React & Angular  
> **Goal**: Achieve feature parity with Stencil for production-ready design systems

## 🔥 HIGH PRIORITY - Core Missing Features

### ⚠️ Critical Decorators & API (Missing from Runtime)

- [ ] **@Watch() decorator** - Watch property/state changes (mentioned as missing in runtime/src/decorators/README.md)
  - Essential for validation, side effects, and complex state management
  - Required for React/Angular integration patterns
  - Currently has partial implementation in decorators/README.md but not exported

- [ ] **@Method() decorator** - Expose public component methods (mentioned as missing)
  - Critical for imperative component APIs (focus, open, close, etc.)
  - Required for React refs and Angular ViewChild integration
  - Must be async to match Stencil patterns

- [ ] **@Element() decorator** - Direct element reference (exists but deprecated)
  - Currently shows warning message, needs proper implementation
  - Essential for direct DOM manipulation and measurements

### 🔧 Lifecycle Methods (Partially Implemented)

- [ ] **componentWillUpdate()** - Missing from ComponentInterface
  - Called before updates (not on first render)
  - Essential for performance optimizations

- [ ] **componentDidUpdate()** - Missing from ComponentInterface  
  - Called after updates (not on first render)
  - Required for DOM measurements post-update

- [ ] **componentDidRender()** - Missing from ComponentInterface
  - Called after every render
  - Important for React/Angular integration timing

- [ ] **componentOnReady()** utility method
  - Promise-based detection of component ready state
  - Critical for programmatic component usage

### 🎨 Component Features

- [ ] **Slots & Content Projection** system
  - Basic slot support for design system flexibility
  - Named slots for complex component layouts
  - Currently has `captureForVNodeProjection` but may need enhancement

- [ ] **CSS Custom Properties integration**
  - Design token system integration
  - CSS-in-JS support for React
  - CSS modules support

- [ ] **Form Association** (formAssociated option exists but marked not implemented)
  - Custom form controls integration
  - Validation integration
  - Required for design system form components

## 🚀 MEDIUM PRIORITY - Framework Integration

### ⚛️ React Integration Missing

- [ ] **@pencel/react package** (mentioned in README as ✅ but doesn't exist)
  - Typed React component wrappers
  - Proper event handling with React synthetic events
  - Ref forwarding for @Method() calls
  - TypeScript definitions

- [ ] **React-specific features**
  - Controlled/uncontrolled component patterns
  - React DevTools integration
  - Proper useState integration
  - Error boundary support

### 🅰️ Angular Integration Missing

- [ ] **@pencel/angular package** (mentioned in README as ✅ but doesn't exist)
  - Angular component wrappers with proper change detection
  - FormControl integration for reactive forms
  - Angular-specific TypeScript definitions
  - Proper lifecycle hook integration

- [ ] **Angular-specific features**
  - NgModel support for form components
  - Angular animations integration
  - Proper zone.js integration
  - Angular CLI schematic support

## 🛠️ MEDIUM PRIORITY - Developer Experience

### 📦 CLI & Tooling Missing/Incomplete

- [ ] **Component generator** (CLI exists but only has transform command)
  - `pencel generate component` command
  - Template scaffolding with best practices
  - Automatic story generation for Storybook

- [ ] **Framework binding generators** (mentioned as planned in README)
  - `pencel generate react` command
  - `pencel generate angular` command
  - Automatic TypeScript definitions

- [ ] **Build & bundling improvements**
  - Better integration with Vite/Rollup
  - Tree-shaking optimization
  - Bundle size analysis

### 🧪 Testing & Documentation

- [ ] **Testing utilities package**
  - Jest/Vitest testing helpers
  - Component testing utilities
  - Mock helpers for @Method() calls

- [ ] **Storybook integration**
  - Automatic story generation
  - Controls inference from @Prop() definitions
  - Documentation auto-generation

## 🎯 LOW PRIORITY - Advanced Features

### 🔄 Advanced State Management

- [ ] **Store integration** (decorator exists but may need enhancement)
  - Global state management
  - Connect patterns for design systems
  - Redux/Zustand integration helpers

### ⚡ Performance Optimizations

- [ ] **Lazy loading utilities**
  - Component-level code splitting
  - Dynamic imports helper
  - Performance monitoring

- [ ] **Advanced rendering optimizations**
  - Better change detection
  - Rendering batching
  - Memory management improvements

### 🎨 Advanced Styling

- [ ] **Theme system**
  - Design token management
  - Dark/light mode utilities
  - CSS custom property helpers

- [ ] **Animation system**
  - Component transition utilities
  - Animation composition helpers
  - React/Angular animation integration

## 🔧 INFRASTRUCTURE - Build & Release

### 📋 Documentation & Examples

- [ ] **Comprehensive documentation site**
  - Migration guide from Stencil
  - React integration examples
  - Angular integration examples
  - Best practices guide

- [ ] **Example applications**
  - Full React design system implementation
  - Full Angular design system implementation
  - Migration examples from Stencil

### 🚀 Release & Distribution

- [ ] **NPM packages structure**
  - @pencel/core (exists)
  - @pencel/react (missing)
  - @pencel/angular (missing)
  - @pencel/cli (exists but minimal)

- [ ] **Release automation**
  - Automated versioning
  - Changelog generation
  - NPM publishing pipeline

## 🎯 SUCCESS CRITERIA

To be considered production-ready for React & Angular design systems:

1. ✅ **Core decorators complete**: @Watch, @Method, @Element properly implemented
2. ✅ **Framework packages**: Both @pencel/react and @pencel/angular available
3. ✅ **Component lifecycle**: All Stencil lifecycle methods implemented
4. ✅ **Developer tools**: CLI with component generation and framework binding
5. ✅ **Documentation**: Migration guide and integration examples
6. ✅ **Testing**: Testing utilities and examples

## 📚 References

- [Stencil Component Lifecycle](https://stenciljs.com/docs/component-lifecycle)
- [Stencil Component API](https://stenciljs.com/docs/api)
- [Stencil Properties](https://stenciljs.com/docs/properties)
- [Stencil Events](https://stenciljs.com/docs/events)
- [Stencil Methods](https://stenciljs.com/docs/methods)

---

**Last Updated**: September 15, 2025  
**Priority**: Focus on HIGH PRIORITY items for MVP design system compatibility
