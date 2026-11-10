<script>
  import { createEventDispatcher, tick, onMount } from "svelte";
  import Icon from "./Icon.svelte";
  import PreviewCanvas from "./PreviewCanvas.svelte";
  import { MAX_SIDE } from "./utils/renderer";
  export let width;
  export let height;
  export let source;
  export let error = "";
  export let busy = false;
  export let rendering = false;
  export let format = "png";
  export let quality = 95;
  const dispatch = createEventDispatcher();
  let panel;
  let first;
  let locked = false;
  let ratio;
  let selection = "custom";
  $: cropped = width * 9 !== height * 16;
  const sizes = [
    ["hd", "HD", 1920, 1080],
    ["qhd", "QHD", 2560, 1440],
    ["4k", "4K landscape", 3840, 2160],
    ["portrait", "4K portrait", 2160, 3840],
    ["square", "Square", 3000, 3000],
  ];
  function changeDimension(axis, value) {
    selection = "custom";
    const n = Number(value);
    if (axis === "width") {
      width = n;
      if (locked && n > 0) height = Math.max(1, Math.round(n / ratio));
    } else {
      height = n;
      if (locked && n > 0) width = Math.max(1, Math.round(n * ratio));
    }
  }
  function preset(event) {
    selection = event.target.value;
    const selected = sizes.find((item) => item[0] === selection);
    if (selected) {
      width = selected[2];
      height = selected[3];
      ratio = width / height;
    }
  }
  function keyboard(event) {
    if (event.key === "Escape" && !busy) dispatch("close");
    if (event.key !== "Tab") return;
    const controls = [
      ...panel.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
      ),
    ];
    const start = controls[0],
      end = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === start) {
      event.preventDefault();
      end.focus();
    }
    if (!event.shiftKey && document.activeElement === end) {
      event.preventDefault();
      start.focus();
    }
  }
  onMount(() => {
    const previous = document.activeElement;
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    selection =
      sizes.find((item) => item[2] === width && item[3] === height)?.[0] ||
      "custom";
    tick().then(() => first.focus());
    return () => {
      document.body.style.overflow = scroll;
      previous?.focus();
    };
  });
</script>

<svelte:window on:keydown={keyboard} />
<div class="modal-backdrop" on:click|self={() => !busy && dispatch("close")}>
  <section
    class="export-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="export-title"
    aria-describedby="export-description"
    bind:this={panel}
  >
    <header class="dialog-header">
      <div>
        <p class="eyebrow">The finishing touch</p>
        <h2 id="export-title">Make it yours.</h2>
        <p id="export-description" class="muted">
          Your gradient, at just the right size.
        </p>
      </div>
      <button
        class="icon-button"
        aria-label="Close export"
        disabled={busy}
        on:click={() => dispatch("close")}
        bind:this={first}><Icon name="close" /></button
      >
    </header>
    <div class="export-grid">
      <div class="export-preview-panel">
        <div class="export-preview">
          <PreviewCanvas
            {source}
            label="Export preview with monochrome grain"
          />
        </div>
        <div class="preview-caption">
          <span>{cropped ? "Centered crop" : "Export preview"}</span><span
            class="mono"
            >{error
              ? "Adjust dimensions"
              : `${width.toLocaleString()} × ${height.toLocaleString()} px`}</span
          >
        </div>
        <div class="print-note">
          <Icon name="image" />
          <p>
            <strong>Ready for the big picture.</strong><br />300 DPI metadata
            included.
            <span class="muted"
              >{!error
                ? `${(width / 300).toFixed(1)} × ${(height / 300).toFixed(1)} in at print size.`
                : "Set your dimensions to see the print size."}</span
            >
          </p>
        </div>
      </div>
      <form
        class="export-controls"
        on:submit|preventDefault={() =>
          !error && !busy && !rendering && dispatch("download")}
      >
        <fieldset disabled={busy}>
          <label class="field-label" for="size-preset">Canvas size</label>
          <select id="size-preset" value={selection} on:change={preset}
            ><option value="custom">Custom dimensions</option
            >{#each sizes as size}<option value={size[0]}
                >{size[1]} · {size[2]} × {size[3]}</option
              >{/each}</select
          >
          <p class="crop-hint">
            {cropped
              ? "A centered cut from your landscape. No stretching."
              : "Your full landscape composition."}
          </p>
          <div class="dimension-heading">
            <span class="muted">Dimensions in pixels</span>
            <div class="dimension-actions">
              <button
                type="button"
                class:active={locked}
                class="icon-button small"
                aria-label={locked
                  ? "Unlock aspect ratio"
                  : "Lock aspect ratio"}
                aria-pressed={locked}
                on:click={() => {
                  locked = !locked;
                  ratio = width / height;
                }}
                disabled={!width || !height}
                ><Icon name={locked ? "lock" : "unlock"} size={16} /></button
              ><button
                type="button"
                class="icon-button small"
                aria-label="Swap width and height"
                on:click={() => {
                  [width, height] = [height, width];
                  ratio = width / height;
                  selection = "custom";
                }}><Icon name="swap" size={16} /></button
              >
            </div>
          </div>
          <div class="dimension-fields">
            <div>
              <label for="export-width">Width</label>
              <div class="unit-input">
                <input
                  id="export-width"
                  type="number"
                  min="1"
                  max={MAX_SIDE}
                  step="1"
                  value={width || ""}
                  on:input={(event) =>
                    changeDimension("width", event.target.value)}
                  aria-invalid={!!error}
                /><span>px</span>
              </div>
              <input
                aria-label="Width slider"
                type="range"
                min="1"
                max={MAX_SIDE}
                step="1"
                value={width}
                on:input={(event) =>
                  changeDimension("width", event.target.value)}
              />
            </div>
            <span class="times">×</span>
            <div>
              <label for="export-height">Height</label>
              <div class="unit-input">
                <input
                  id="export-height"
                  type="number"
                  min="1"
                  max={MAX_SIDE}
                  step="1"
                  value={height || ""}
                  on:input={(event) =>
                    changeDimension("height", event.target.value)}
                  aria-invalid={!!error}
                /><span>px</span>
              </div>
              <input
                aria-label="Height slider"
                type="range"
                min="1"
                max={MAX_SIDE}
                step="1"
                value={height}
                on:input={(event) =>
                  changeDimension("height", event.target.value)}
              />
            </div>
          </div>
          <label class="field-label format-label" for="format-png"
            >File format</label
          >
          <div class="format-picker" role="group" aria-label="Image format">
            {#each ["png", "jpeg", "webp"] as option}<button
                id={`format-${option}`}
                type="button"
                class:selected={format === option}
                aria-pressed={format === option}
                on:click={() => (format = option)}
                >{option.toUpperCase()}{#if format === option}<Icon
                    name="check"
                    size={14}
                  />{/if}</button
              >{/each}
          </div>
          <div class="format-hint">
            {format === "png"
              ? "Lossless detail. Perfect for design and print."
              : format === "jpeg"
                ? "Smaller files. A familiar format for any workflow."
                : "Efficient compression. Made for the web."}
          </div>
          {#if format !== "png"}<div class="quality-heading">
              <label for="export-quality">Quality</label><span class="mono"
                >{quality}%</span
              >
            </div>
            <input
              id="export-quality"
              type="range"
              min="1"
              max="100"
              bind:value={quality}
            />{/if}
          <div class="density-row">
            <span>Print density</span><span class="density-pill">300 DPI</span>
          </div>
        </fieldset>
        {#if error}<p class="error" role="alert">{error}</p>{/if}
        <button
          class="button primary download-button"
          type="submit"
          disabled={!!error || busy || rendering}
          ><Icon name="download" />{busy
            ? "Preparing your image…"
            : rendering
              ? "Updating preview…"
              : `Download ${format.toUpperCase()}`}</button
        >
        <p class="export-footnote">
          Rendered at full resolution. Grain included.
        </p>
      </form>
    </div>
  </section>
</div>
