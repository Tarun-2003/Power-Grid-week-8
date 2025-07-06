const fs = require('fs');
const readline = require('readline');

function extractNodesAndEdges(filepath) {
  const lines = fs.readFileSync(filepath, 'utf-8').split('\n');
  const nodes = [];
  const edges = [];

  let readingBus = false;
  let readingBranch = false;

  for (let line of lines) {
    line = line.trim();

    // Detect start/end of bus data
    if (line.startsWith('mpc.bus = [')) {
      readingBus = true;
      continue;
    }
    if (readingBus && line.startsWith('];')) {
      readingBus = false;
      continue;
    }

    // Detect start/end of branch data
    if (line.startsWith('mpc.branch = [')) {
      readingBranch = true;
      continue;
    }
    if (readingBranch && line.startsWith('];')) {
      readingBranch = false;
      continue;
    }

    // Parse bus lines
    if (readingBus && /^\d+/.test(line)) {
      const parts = line.trim().split(/\s+/);
      const bus_id = parseInt(parts[0]);
      const voltage = parseFloat(parts[9]);

      nodes.push({
        data: {
          id: bus_id.toString(),
          voltage: voltage
        }
      });
    }

    // Parse branch lines
    if (readingBranch && /^\d+/.test(line)) {
      const parts = line.trim().split(/\s+/);
      const source = parseInt(parts[0]).toString();
      const target = parseInt(parts[1]).toString();

      edges.push({
        data: {
          source: source,
          target: target
        }
      });
    }
  }

  return { nodes, edges };
}

// === CLI Execution ===
console.log("Script is running...");

const readlineSync = require('readline-sync');
const filename = readlineSync.question("Please enter the path to the dataset file (e.g., pglib_opf_case30_ieee.m): ");

const data = extractNodesAndEdges(filename);
const outputFilename = filename + ".json";

fs.writeFileSync(outputFilename, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Data extracted and saved to ${outputFilename}`);
