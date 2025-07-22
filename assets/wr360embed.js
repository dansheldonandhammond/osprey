// Dummy wr360embed.js placeholder
function createWR360Player(config) {
  console.log("WebRotate360 viewer initialized with config:", config);
  // Simulate API ready callback
  setTimeout(() => {
    config.onViewerReady({
      hotspots: {
        getDynamicHotspots: () => [
          { id: "FLOATING_TOP_LID", title: "Floating Top Lid", description: "Includes key clip & storage" }
        ],
        focusHotspot: (id) => console.log("Focusing hotspot:", id)
      }
    });
  }, 500);
}
