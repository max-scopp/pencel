# Pencil Performance Dashboard Example

This example demonstrates the performance characteristics of Pencil components under heavy load. It simulates a complex dashboard with multiple types of components that render large amounts of DOM elements.

## Features

### Performance Monitoring
- **Real-time Performance Metrics**: Tracks average, min, and max render times
- **Component Counting**: Shows active component count and total DOM elements
- **Performance History**: Maintains a rolling history of render performance

### Test Components

#### 1. Chart Components (`perf-chart`)
- Renders SVG charts with configurable data points (default: 100)
- Creates circles and lines for each data point
- Tests SVG rendering performance and data visualization

#### 2. Table Components (`perf-table`)
- Renders sortable data tables with configurable row counts (default: 50)
- Includes interactive sorting functionality
- Tests large DOM table rendering and interactivity

#### 3. Grid Components (`perf-grid`)
- Renders grid layouts with configurable tile counts (default: 100)
- Creates metric cards with trend indicators
- Tests CSS Grid performance with many small elements

### Interactive Controls
- **Add/Remove Components**: Dynamically add or remove component instances
- **Adjust Complexity**: Change the number of data points, rows, or tiles per component
- **Bulk Updates**: Update all components simultaneously to test update performance
- **Performance Reset**: Clear performance history to start fresh measurements

## Performance Testing Scenarios

### Light Load
- 3 charts (100 data points each)
- 2 tables (50 rows each)
- 2 grids (100 tiles each)
- **Total Elements**: ~1,000+ DOM elements

### Medium Load
- 6 charts (200 data points each)
- 4 tables (100 rows each)
- 4 grids (200 tiles each)
- **Total Elements**: ~3,000+ DOM elements

### Heavy Load
- 10+ charts (500+ data points each)
- 6+ tables (200+ rows each)
- 6+ grids (500+ tiles each)
- **Total Elements**: 10,000+ DOM elements

## Key Performance Insights

This example helps identify:

1. **Rendering Bottlenecks**: Which components are slowest to render
2. **Update Performance**: How quickly components can re-render with new data
3. **Memory Usage**: How the framework handles large numbers of DOM elements
4. **Interactivity**: Whether the UI remains responsive under load
5. **Scaling Limits**: At what point performance degrades significantly

## Usage

1. Open the example in your browser
2. Monitor the performance statistics at the top
3. Use the controls to add components and increase complexity
4. Watch render times and identify performance thresholds
5. Use "Update All Components" to stress test update performance

## Development Notes

- Performance measurements use the browser's `Performance API`
- Render times are tracked for individual component updates
- The dashboard maintains a rolling window of the last 100 measurements
- All components use shadow DOM for style encapsulation
- State management is handled by Pencil's reactive system

This example is particularly useful for:
- Framework performance benchmarking
- Identifying optimization opportunities
- Testing real-world dashboard scenarios
- Understanding scaling characteristics