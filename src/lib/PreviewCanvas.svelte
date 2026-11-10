<script>
  export let source = null;
  export let label = "Gradient preview";
  let canvas;
  $: if (canvas && source) {
    const scale = Math.min(1, 1400 / Math.max(source.width, source.height));
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    canvas
      .getContext("2d")
      .drawImage(source, 0, 0, canvas.width, canvas.height);
  }
</script>

<canvas bind:this={canvas} role="img" aria-label={label} />

<style>
  canvas {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
