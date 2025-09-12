// biome-ignore lint/correctness/noUnusedImports: JSX imports needed for runtime
import { h, render } from "../../src";

// Application state (no charts)
const state = {
  tableCount: 2,
  gridCount: 1,
  rowsPerTable: 25,
  tilesPerGrid: 100,
  lastUpdate: Date.now(),
  tableData: [] as {
    id: number;
    name: string;
    value: number;
    status: string;
    progress: number;
  }[][],
  gridData: [] as number[][],
};

// Generate data functions
function generateTableData(count: number, rows: number) {
  const tables = [];
  for (let i = 0; i < count; i++) {
    const data = [];
    for (let j = 0; j < rows; j++) {
      data.push({
        id: j + 1,
        name: `Item ${j + 1}`,
        value: Math.round(Math.random() * 1000),
        status: Math.random() > 0.5 ? "Active" : "Inactive",
        progress: Math.round(Math.random() * 100),
      });
    }
    tables.push(data);
  }
  return tables;
}

function generateGridData(count: number, tiles: number): number[][] {
  const grids = [];
  for (let i = 0; i < count; i++) {
    const data = [];
    for (let j = 0; j < tiles; j++) {
      data.push(Math.random() * 100);
    }
    grids.push(data);
  }
  return grids;
}

// Update functions
function updateTables() {
  state.tableData = generateTableData(state.tableCount, state.rowsPerTable);
  renderApp();
}

function updateGrids() {
  state.gridData = generateGridData(state.gridCount, state.tilesPerGrid);
  renderApp();
}

function updateAll() {
  state.tableData = generateTableData(state.tableCount, state.rowsPerTable);
  state.gridData = generateGridData(state.gridCount, state.tilesPerGrid);
  state.lastUpdate = Date.now();
  renderApp();
}

function addTable() {
  state.tableCount++;
  updateTables();
}

function removeTable() {
  if (state.tableCount > 0) {
    state.tableCount--;
    updateTables();
  }
}

function addGrid() {
  state.gridCount++;
  updateGrids();
}

function removeGrid() {
  if (state.gridCount > 0) {
    state.gridCount--;
    updateGrids();
  }
}

// Render function - one big render call
function renderApp() {
  const root = document.getElementById("root");
  if (!root) return;

  // Create all tables
  const tables = state.tableData.map((data, tableIndex) => (
    <div
      key={`table-${tableIndex}`}
      style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #333;">Table {tableIndex + 1}</h3>
        <button
          onClick={updateTables}
          style="padding: 5px 10px; border: none; border-radius: 4px; background: #28a745; color: white; cursor: pointer;"
        >
          Update
        </button>
      </div>
      <div style="max-height: 300px; overflow-y: auto; border: 1px solid #eee;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">
                ID
              </th>
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">
                Name
              </th>
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">
                Value
              </th>
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">
                Status
              </th>
              <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td style="padding: 8px; border: 1px solid #dee2e6;">
                  {row.id}
                </td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">
                  {row.name}
                </td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">
                  ${row.value}
                </td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">
                  <span
                    style={`padding: 2px 6px; border-radius: 4px; font-size: 12px; ${
                      row.status === "Active"
                        ? "background: #d4edda; color: #155724;"
                        : "background: #f8d7da; color: #721c24;"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">
                  <div style="position: relative; background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">
                    <div
                      style={`position: absolute; left: 0; top: 0; height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; width: ${row.progress}%;`}
                    />
                    <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 11px; font-weight: bold;">
                      {row.progress}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style="margin-top: 10px; text-align: center; color: #666; font-size: 12px;">
        {data.length} rows
      </div>
    </div>
  ));

  // Create all grids
  const grids = state.gridData.map((data, gridIndex) => (
    <div
      key={`grid-${gridIndex}`}
      style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #333;">Grid {gridIndex + 1}</h3>
        <button
          onClick={updateGrids}
          style="padding: 5px 10px; border: none; border-radius: 4px; background: #6f42c1; color: white; cursor: pointer;"
        >
          Update
        </button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 2px; max-height: 400px; overflow-y: auto; border: 1px solid #eee; padding: 10px;">
        {data.map((value, tileIndex) => (
          <div
            key={`tile-${tileIndex}`}
            style={`width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; background: hsl(${
              (value / 100) * 120
            }, 70%, 50%);`}
            title={`Value: ${value.toFixed(1)}`}
          >
            {Math.round(value)}
          </div>
        ))}
      </div>
      <div style="margin-top: 10px; text-align: center; color: #666; font-size: 12px;">
        {data.length} tiles
      </div>
    </div>
  ));

  // Control panel
  const controls = (
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
      <h3 style="margin: 0 0 15px 0; color: #333;">Controls</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
        <div>
          <h4 style="margin: 0 0 10px 0; color: #555;">
            Tables ({state.tableCount})
          </h4>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button
              onClick={addTable}
              style="padding: 5px 10px; border: none; border-radius: 4px; background: #28a745; color: white; cursor: pointer;"
            >
              +
            </button>
            <button
              onClick={removeTable}
              style="padding: 5px 10px; border: none; border-radius: 4px; background: #dc3545; color: white; cursor: pointer;"
            >
              -
            </button>
            <span style="margin-left: 10px;">Rows:</span>
            <input
              type="number"
              value={state.rowsPerTable}
              onInput={(e) => {
                state.rowsPerTable =
                  parseInt((e.target as HTMLInputElement).value) || 25;
                updateTables();
              }}
              style="width: 70px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;"
            />
          </div>
        </div>

        <div>
          <h4 style="margin: 0 0 10px 0; color: #555;">
            Grids ({state.gridCount})
          </h4>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button
              onClick={addGrid}
              style="padding: 5px 10px; border: none; border-radius: 4px; background: #28a745; color: white; cursor: pointer;"
            >
              +
            </button>
            <button
              onClick={removeGrid}
              style="padding: 5px 10px; border: none; border-radius: 4px; background: #dc3545; color: white; cursor: pointer;"
            >
              -
            </button>
            <span style="margin-left: 10px;">Tiles:</span>
            <input
              type="number"
              value={state.tilesPerGrid}
              onInput={(e) => {
                state.tilesPerGrid =
                  parseInt((e.target as HTMLInputElement).value) || 100;
                updateGrids();
              }}
              style="width: 70px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;"
            />
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: center;">
        <button
          onClick={updateAll}
          style="padding: 10px 20px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer; font-weight: bold;"
        >
          Update All
        </button>
      </div>
    </div>
  );

  // Main layout - one big render call
  const app = (
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; min-height: 100vh; padding: 20px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <h1 style="text-align: center; color: #333; margin-bottom: 30px;">
          Performance Dashboard (Tables & Grids Only)
        </h1>

        {controls}

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">
          {tables}
          {grids}
        </div>
      </div>
    </div>
  );

  // Single render call
  render(app, root);
}

// Initialize the app
function init() {
  state.tableData = generateTableData(state.tableCount, state.rowsPerTable);
  state.gridData = generateGridData(state.gridCount, state.tilesPerGrid);
  renderApp();
}

// Auto-update every 5 seconds for stress testing
setInterval(() => {
  updateAll();
}, 5000);

init();
