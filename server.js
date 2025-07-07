const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const upload = multer({ dest: 'uploads/' });

app.use(express.static(__dirname)); // Serves HTML, JS, etc.

app.post('/upload', upload.single('file'), (req, res) => {
  const uploadedPath = req.file.path;

  fs.readFile(uploadedPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Cannot read file' });

    try {
      const graphRaw = JSON.parse(data);
      const nodes = graphRaw.nodes.map(n => ({
        id: n.data.id,
        voltage: n.data.voltage
      }));

      const voltageMap = {};
      nodes.forEach(n => voltageMap[n.id] = n.voltage);

      const edges = graphRaw.edges
        .map(e => ({ source: e.data.source, target: e.data.target }))
        .filter(e => voltageMap[e.source] === voltageMap[e.target]);

      const adjacency = {};
      nodes.forEach(n => adjacency[n.id] = []);
      edges.forEach(e => {
        adjacency[e.source].push(e.target);
        adjacency[e.target].push(e.source);
      });

      let componentId = 0;
      const visited = new Set();
      const components = [];

      function dfs(nodeId, comp) {
        visited.add(nodeId);
        comp.push(nodeId);
        adjacency[nodeId].forEach(nei => {
          if (!visited.has(nei)) dfs(nei, comp);
        });
      }

      nodes.forEach(n => {
        if (!visited.has(n.id)) {
          const comp = [];
          dfs(n.id, comp);
          comp.forEach(id => {
            const node = nodes.find(x => x.id === id);
            node.component = componentId + 1;
          });
          components.push(comp);
          componentId++;
        }
      });

      const segmentMap = {};
      nodes.forEach(n => {
        segmentMap[n.id] = n.component;
      });

      const savePath = path.join(__dirname, 'segmentMap.json');
      fs.writeFileSync(savePath, JSON.stringify(segmentMap, null, 2));

      res.json({ message: 'Segment map saved', path: savePath });
    } catch (e) {
      res.status(500).json({ error: 'JSON processing error' });
    }
  });
});

app.listen(PORT, () => {
  console.log(` Server running at http://127.0.0.1:${PORT}`);
});
