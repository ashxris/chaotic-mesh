<script>
  import { onMount, tick } from "svelte";
  import { get } from "svelte/store";
  import Icon from "./lib/Icon.svelte";
  import PreviewCanvas from "./lib/PreviewCanvas.svelte";
  import ExportDialog from "./lib/ExportDialog.svelte";
  import { presets } from "./lib/store";
  import {
    renderGradient,
    renderPresetThumbnails,
    validateSize,
    initializeRenderer,
    releaseRenderer,
  } from "./lib/utils/renderer";
  import { downloadImage } from "./lib/utils/exportImage";
  import "./styles/studio.scss";
  let images = [];
  const palettePresets = get(presets);
  const initialColors = ["#eb75b6", "#ddf3ff", "#6e3deb", "#c92f3c"];
  let colors = [...initialColors];
  let seed = 757;
  let grain = 0;
  let width = 3840;
  let height = 2160;
  let format = "png";
  let quality = 95;
  let selectedPreset = -1;
  let source = null;
  let mounted = false;
  let rendering = false;
  let busy = false;
  let showExport = false;
  let sizeError = "";
  let renderError = "";
  let downloadError = "";
  let notice = "";
  let timer;
  let noticeTimer;
  let thumbnailTimer;
  let paletteRail;
  let previewObserver;
  let canScrollBackward = false;
  let canScrollForward = false;
  const paletteNodes = new Map();
  const previewQueue = new Set();

  function updatePaletteScroll() {
    if (!paletteRail) return;
    canScrollBackward = paletteRail.scrollLeft > 2;
    canScrollForward =
      paletteRail.scrollLeft + paletteRail.clientWidth <
      paletteRail.scrollWidth - 2;
  }
  function scrollPalettes(direction) {
    paletteRail?.scrollBy({
      left: direction * Math.max(240, paletteRail.clientWidth * 0.8),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  function observePalette(node, index) {
    paletteNodes.set(index, node);
    if (previewObserver) previewObserver.observe(node);
    return {
      destroy() {
        previewObserver?.unobserve(node);
        paletteNodes.delete(index);
        previewQueue.delete(index);
      },
    };
  }
  function scheduleThumbnail() {
    if (thumbnailTimer || !previewQueue.size) return;
    thumbnailTimer = setTimeout(() => {
      thumbnailTimer = null;
      if (!mounted || renderError) return;
      if (
        !source ||
        rendering ||
        busy ||
        showExport ||
        validateSize(width, height)
      ) {
        scheduleThumbnail();
        return;
      }
      const index = previewQueue.values().next().value;
      previewQueue.delete(index);
      if (!images[index]) {
        try {
          const [image] = renderPresetThumbnails([palettePresets[index]], {
            width,
            height,
            colors,
            seed,
            grain,
          });
          if (image) {
            images[index] = image;
            images = [...images];
            previewObserver?.unobserve(paletteNodes.get(index));
          }
          source = source;
        } catch {
          // Keep exact swatches when the device cannot generate a preview.
        }
      }
      scheduleThumbnail();
    }, 180);
  }
  let serial = 0;
  let hexDrafts = [...colors];
  $: hexDrafts = [...colors];
  $: sizeError = validateSize(width, height);
  $: if (mounted) scheduleRender({ width, height, colors, seed, grain });
  function scheduleRender(settings) {
    clearTimeout(timer);
    const current = ++serial;
    if (validateSize(settings.width, settings.height)) {
      rendering = false;
      return;
    }
    rendering = true;
    renderError = "";
    downloadError = "";
    timer = setTimeout(async () => {
      await tick();
      if (current !== serial) return;
      try {
        source = renderGradient(settings);
      } catch (error) {
        renderError = error.message || "The preview could not be rendered.";
      } finally {
        rendering = false;
      }
    }, 100);
  }
  function updateColor(index, value) {
    if (!/^#[0-9a-f]{6}$/i.test(value)) {
      hexDrafts = [...colors];
      return;
    }
    colors = colors.map((color, i) =>
      i === index ? value.toLowerCase() : color,
    );
    selectedPreset = -1;
  }
  function updateGrain(event) {
    const raw = event.currentTarget.value;
    if (raw === "" || !Number.isFinite(Number(raw))) return;
    grain = Math.max(0, Math.min(100, Math.round(Number(raw))));
    if (Number(raw) !== grain) event.currentTarget.value = String(grain);
  }
  function randomize() {
    seed = Math.floor(Math.random() * 1000);
    selectedPreset = -1;
  }
  function applyPreset(index) {
    const preset = palettePresets[index];
    colors = [...preset.meshColors];
    seed = preset.meshId;
    selectedPreset = index;
  }
  function reset() {
    colors = [...initialColors];
    seed = 757;
    grain = 0;
    selectedPreset = -1;
  }
  async function exportCurrent() {
    if (busy || rendering || sizeError || renderError || !source) return;
    busy = true;
    downloadError = "";
    try {
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      await downloadImage(source, { format, quality, seed });
      notice = "Your gradient is ready. Enjoy the chaos.";
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => (notice = ""), 5000);
    } catch (error) {
      downloadError = error.message;
    } finally {
      busy = false;
    }
  }
  function keydown(event) {
    if (
      !showExport &&
      event.code === "Space" &&
      !["INPUT", "SELECT", "BUTTON", "TEXTAREA"].includes(event.target.tagName)
    ) {
      event.preventDefault();
      randomize();
    }
  }
  onMount(() => {
    try {
      initializeRenderer();
      mounted = true;
      updatePaletteScroll();
      // Render only cards near the scroll viewport, one at a time between interactions.
      if ("IntersectionObserver" in window) {
        previewObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const index = Number(entry.target.dataset.paletteIndex);
              if (entry.isIntersecting && !images[index])
                previewQueue.add(index);
              else previewQueue.delete(index);
            }
            scheduleThumbnail();
          },
          { root: paletteRail, rootMargin: "0px 160px", threshold: 0.01 },
        );
        for (const node of paletteNodes.values()) previewObserver.observe(node);
      } else {
        // Older browsers still get a usable, exact-color palette strip immediately.
        for (let index = 0; index < Math.min(6, palettePresets.length); index++)
          previewQueue.add(index);
        scheduleThumbnail();
      }
    } catch (error) {
      renderError = error.message;
    }
    return () => {
      clearTimeout(timer);
      clearTimeout(noticeTimer);
      clearTimeout(thumbnailTimer);
      previewObserver?.disconnect();
      mounted = false;
      releaseRenderer();
    };
  });
</script>

<svelte:window on:keydown={keydown} on:resize={updatePaletteScroll} />
<div
  class="studio-shell"
  aria-hidden={showExport ? "true" : undefined}
  inert={showExport ? "" : undefined}
>
  <header class="studio-header">
    <a class="wordmark" href="/" aria-label="chaotic-mesh home"
      >chaotic<span>-</span>mesh<span class="logo-dot"></span></a
    ><span class="header-note">A playground for color.</span><button
      class="button header-export"
      on:click={() => (showExport = true)}
      disabled={!!renderError || !source}
      ><Icon name="download" size={16} />Export gradient</button
    >
  </header>
  <main>
    <div class="intro">
      <div>
        <p class="eyebrow">The gradient studio</p>
        <h1>Find beauty in the chaos<span>.</span></h1>
        <p class="intro-description">
          Mix a palette. Add a little texture. Make something unexpected.
        </p>
      </div>
      <div class="edition">
        <span class="status-dot"></span>Endless possibilities
      </div>
    </div>
    <div class="workspace">
      <section class="preview-section" aria-label="Gradient canvas">
        <div class="section-bar">
          <span><span class="status-dot"></span>Your canvas</span><span
            class="mono"
            >{width.toLocaleString()} × {height.toLocaleString()} px</span
          >
        </div>
        <div class="canvas-stage" class:updating={rendering}>
          <div
            class="canvas-frame"
            style={`--canvas-ratio: ${source ? source.width / source.height : 16 / 9}`}
          >
            <PreviewCanvas {source} />
          </div>
          {#if renderError}<p class="canvas-error" role="alert">
              {renderError}
            </p>{/if}
          {#if !source && !renderError}<span class="loading-label"
              >Finding a little chaos…</span
            >{/if}
        </div>
        <div class="canvas-footer">
          <span
            ><span class="tiny-dot"></span>{rendering
              ? "Updating your canvas…"
              : "Made by chance. Refined by you."}</span
          ><button
            class="text-button"
            on:click={() => (showExport = true)}
            disabled={!source}
            ><Icon name="expand" size={14} />Resize & export</button
          >
        </div>
      </section>
      <aside class="controls" aria-label="Gradient controls">
        <div class="controls-heading">
          <h2>Make it your own</h2>
          <button
            class="icon-button small"
            aria-label="Reset palette, mesh ID, and grain"
            title="Reset controls"
            on:click={reset}
            disabled={busy}><Icon name="reset" size={16} /></button
          >
        </div>
        <fieldset disabled={busy}>
          <div class="control-label">
            <label for="mesh-seed">Composition</label><span class="muted"
              >Mesh ID</span
            >
          </div>
          <div class="seed-field">
            <span class="hash">#</span><input
              id="mesh-seed"
              aria-label="Mesh ID"
              type="number"
              min="0"
              max="999999"
              step="1"
              value={seed}
              on:change={(event) => {
                seed = Math.max(
                  0,
                  Math.min(999999, Math.floor(Number(event.target.value) || 0)),
                );
                selectedPreset = -1;
              }}
            /><span class="seed-caption">Reproducible</span>
          </div>
          <div class="control-label palette-label">
            <span>Color palette</span><span class="mono muted">04 colors</span>
          </div>
          <div class="color-grid">
            {#each colors as color, index}<div class="color-item">
                <label class="color-swatch" style={`--swatch: ${color}`}
                  ><input
                    type="color"
                    aria-label={`Choose color ${index + 1}`}
                    value={color}
                    on:input={(event) => updateColor(index, event.target.value)}
                  /><span class="color-index">0{index + 1}</span><span
                    class="swatch-edit">↗</span
                  ></label
                ><input
                  class="hex-input mono"
                  aria-label={`Color ${index + 1} hex code`}
                  type="text"
                  maxlength="7"
                  value={hexDrafts[index]}
                  on:change={(event) => updateColor(index, event.target.value)}
                  spellcheck="false"
                />
              </div>{/each}
          </div>
          <div class="grain-control">
            <div class="control-label">
              <label for="grain-strength">Grain</label>
              <label class="value-pill grain-value mono">
                <input
                  id="grain-percentage"
                  type="number"
                  aria-label="Grain percentage"
                  min="0"
                  max="100"
                  step="1"
                  inputmode="numeric"
                  value={grain}
                  on:input={updateGrain}
                  on:blur={(event) =>
                    (event.currentTarget.value = String(grain))}
                />
                <span aria-hidden="true">%</span>
              </label>
            </div>
            <input
              id="grain-strength"
              type="range"
              min="0"
              max="100"
              step="1"
              bind:value={grain}
            />
            <div class="slider-labels">
              <span>Silky smooth</span><span>Beautifully textured</span>
            </div>
            <p class="grain-hint">Drag or type a value from 0–100%.</p>
          </div>
          <button class="button primary randomize-button" on:click={randomize}
            ><Icon name="shuffle" size={18} />Shuffle composition<span
              class="keycap"
              aria-hidden="true">␣</span
            ></button
          >
        </fieldset>
        <p class="keyboard-hint">
          Or press <kbd>space</kbd> for a fresh perspective
        </p>
        <button
          type="button"
          class="button controls-export"
          on:click={() => (showExport = true)}
          disabled={busy || !!renderError || !source}
        >
          <Icon name="download" size={16} />Export gradient
        </button>
      </aside>
    </div>
    <section class="presets-section" aria-labelledby="presets-title">
      <div class="presets-heading">
        <div>
          <p class="eyebrow">A place to start</p>
          <h2 id="presets-title">Good things come in palettes.</h2>
        </div>
        <div class="palette-navigation">
          <span class="palette-count muted"
            >{palettePresets.length} palettes to explore</span
          >
          <button
            class="icon-button small previous-palettes"
            aria-label="Previous palettes"
            disabled={!canScrollBackward}
            on:click={() => scrollPalettes(-1)}
            ><Icon name="chevron" size={16} /></button
          >
          <button
            class="icon-button small"
            aria-label="Next palettes"
            disabled={!canScrollForward}
            on:click={() => scrollPalettes(1)}
            ><Icon name="chevron" size={16} /></button
          >
        </div>
      </div>
      <div
        class="presets-grid"
        bind:this={paletteRail}
        on:scroll={updatePaletteScroll}
        role="region"
        aria-label="Color palettes — scroll horizontally to explore"
        tabindex="0"
      >
        {#each palettePresets as preset, index}<button
            class="preset-card"
            data-palette-index={index}
            use:observePalette={index}
            class:chosen={selectedPreset === index}
            aria-pressed={selectedPreset === index}
            on:click={() => applyPreset(index)}
            disabled={busy}
            ><div class="preset-image">
              {#if images[index]}<img src={images[index]} alt="" />{:else}<div
                  class="preset-swatches"
                  aria-hidden="true"
                >
                  {#each preset.meshColors as color}<span
                      style={`background: ${color}`}
                    ></span>{/each}
                </div>{/if}{#if selectedPreset === index}<span
                  class="preset-check"><Icon name="check" size={14} /></span
                >{/if}
            </div>
            <div class="preset-info">
              <span>{preset.name}</span><span class="palette-dots"
                >{#each palettePresets[index].meshColors as color}<i
                    style={`background: ${color}`}
                  ></i>{/each}</span
              >
            </div></button
          >{/each}
      </div>
    </section>
  </main>
  <footer class="studio-footer">
    <span
      >chaotic-mesh<span class="footer-dot">•</span>A little unpredictability
      looks good.</span
    ><span>Made for your next idea.</span>
  </footer>
</div>
<canvas id="gradient-canvas" class="render-source" aria-hidden="true"></canvas>
{#if showExport}<ExportDialog
    bind:width
    bind:height
    bind:format
    bind:quality
    {source}
    error={sizeError || renderError || downloadError}
    {busy}
    {rendering}
    on:close={() => (showExport = false)}
    on:download={exportCurrent}
  />{/if}
{#if notice}<div class="toast" role="status">
    <Icon name="check" size={16} />{notice}
  </div>{/if}
