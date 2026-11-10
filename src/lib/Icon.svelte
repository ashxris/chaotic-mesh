<script>
  export let name;
  export let size = 18;
  const paths = {
    arrow: "M7 17 17 7M7 7h10v10",
    download: "M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4",
    shuffle: "m3 4 4 0 10 16h4m-4-4 4 4-4 4M3 20h4L17 4h4m-4-4 4 4-4 4",
    close: "m6 6 12 12M6 18 18 6",
    swap: "M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4",
    lock: "M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4",
    unlock: "M6 10h12v11H6zM8 10V6a4 4 0 0 1 7-2",
    check: "m5 12 4 4 10-10",
    expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    reset: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
    image: "M3 3h18v18H3zM3 17l6-6 5 5 3-3 4 4M16 7h.01",
    chevron: "m9 5 7 7-7 7",
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"><path d={paths[name] || paths.arrow} /></svg
>
