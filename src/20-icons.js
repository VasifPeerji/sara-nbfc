/* ------------------------------------------------------------------
   Icon set.

   Most glyphs are a plain string of path markup drawn on a shared 24x24
   stroke grid. An icon that needs different geometry declares an object
   instead:
       { d: markup, v: viewBox, w: strokeWidth, f: true for fill-based }
   That exists so the rail can carry the Sara platform's own SVGs verbatim
   rather than approximations of them: two are fill-based, the Lucide ones
   are stroke-width 2, and the MCP mark is drawn on a 195 grid.

   Usage:  <span class="i" data-icon="search"></span>  (hydrated at boot)
           Icons.svg("search")                          (inline)
   ------------------------------------------------------------------ */

const ICON_PATHS = {
  /* navigation + chrome */
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  /* ---- rail glyphs, taken verbatim from the Sara platform ---- */
  /* left sidebar toggle (fill-based) */
  sidebar:{ f:true, d:'<path fill-rule="evenodd" clip-rule="evenodd" d="M8.85719 3H15.1428C16.2266 2.99999 17.1007 2.99998 17.8086 3.05782C18.5375 3.11737 19.1777 3.24318 19.77 3.54497C20.7108 4.02433 21.4757 4.78924 21.955 5.73005C22.2568 6.32234 22.3826 6.96253 22.4422 7.69138C22.5 8.39925 22.5 9.27339 22.5 10.3572V13.6428C22.5 14.7266 22.5 15.6008 22.4422 16.3086C22.3826 17.0375 22.2568 17.6777 21.955 18.27C21.4757 19.2108 20.7108 19.9757 19.77 20.455C19.1777 20.7568 18.5375 20.8826 17.8086 20.9422C17.1008 21 16.2266 21 15.1428 21H8.85717C7.77339 21 6.89925 21 6.19138 20.9422C5.46253 20.8826 4.82234 20.7568 4.23005 20.455C3.28924 19.9757 2.52433 19.2108 2.04497 18.27C1.74318 17.6777 1.61737 17.0375 1.55782 16.3086C1.49998 15.6007 1.49999 14.7266 1.5 13.6428V10.3572C1.49999 9.27341 1.49998 8.39926 1.55782 7.69138C1.61737 6.96253 1.74318 6.32234 2.04497 5.73005C2.52433 4.78924 3.28924 4.02433 4.23005 3.54497C4.82234 3.24318 5.46253 3.11737 6.19138 3.05782C6.89926 2.99998 7.77341 2.99999 8.85719 3ZM6.35424 5.05118C5.74907 5.10062 5.40138 5.19279 5.13803 5.32698C4.57354 5.6146 4.1146 6.07354 3.82698 6.63803C3.69279 6.90138 3.60062 7.24907 3.55118 7.85424C3.50078 8.47108 3.5 9.26339 3.5 10.4V13.6C3.5 14.7366 3.50078 15.5289 3.55118 16.1458C3.60062 16.7509 3.69279 17.0986 3.82698 17.362C4.1146 17.9265 4.57354 18.3854 5.13803 18.673C5.40138 18.8072 5.74907 18.8994 6.35424 18.9488C6.97108 18.9992 7.76339 19 8.9 19H9.5V5H8.9C7.76339 5 6.97108 5.00078 6.35424 5.05118ZM11.5 5V19H15.1C16.2366 19 17.0289 18.9992 17.6458 18.9488C18.2509 18.8994 18.5986 18.8072 18.862 18.673C19.4265 18.3854 19.8854 17.9265 20.173 17.362C20.3072 17.0986 20.3994 16.7509 20.4488 16.1458C20.4992 15.5289 20.5 14.7366 20.5 13.6V10.4C20.5 9.26339 20.4992 8.47108 20.4488 7.85424C20.3994 7.24907 20.3072 6.90138 20.173 6.63803C19.8854 6.07354 19.4265 5.6146 18.862 5.32698C18.5986 5.19279 18.2509 5.10062 17.6458 5.05118C17.0289 5.00078 16.2366 5 15.1 5H11.5ZM5 8.5C5 7.94772 5.44772 7.5 6 7.5H7C7.55229 7.5 8 7.94772 8 8.5C8 9.05229 7.55229 9.5 7 9.5H6C5.44772 9.5 5 9.05229 5 8.5ZM5 12C5 11.4477 5.44772 11 6 11H7C7.55229 11 8 11.4477 8 12C8 12.5523 7.55229 13 7 13H6C5.44772 13 5 12.5523 5 12Z" fill="currentColor"/>' },
  /* new chat (lucide square-pen) */
  compose:{ w:2, d:'<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>' },
  /* chat history (lucide messages-square) */
  chat:{ w:2, d:'<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>' },
  /* bookmarks (lucide bookmark) */
  bookmark:{ w:2, d:'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>' },
  /* attach files (fill-based clip) */
  paperclip:{ f:true, d:'<path fill-rule="evenodd" clip-rule="evenodd" d="M9 7C9 4.23858 11.2386 2 14 2C16.7614 2 19 4.23858 19 7V15C19 18.866 15.866 22 12 22C8.13401 22 5 18.866 5 15V9C5 8.44772 5.44772 8 6 8C6.55228 8 7 8.44772 7 9V15C7 17.7614 9.23858 20 12 20C14.7614 20 17 17.7614 17 15V7C17 5.34315 15.6569 4 14 4C12.3431 4 11 5.34315 11 7V15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15V9C13 8.44772 13.4477 8 14 8C14.5523 8 15 8.44772 15 9V15C15 16.6569 13.6569 18 12 18C10.3431 18 9 16.6569 9 15V7Z" fill="currentColor"/>' },
  /* MCP servers (official mark, 195 grid) */
  layers:{ v:"0 2 195 195", w:16, d:'<path d="M25 97.8528L92.8823 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177" stroke="currentColor" stroke-width="16" stroke-linecap="round"/><path d="M76.2653 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52" stroke="currentColor" stroke-width="16" stroke-linecap="round"/><path d="M109.853 46.9411L59.6482 97.1457C50.2757 106.518 50.2757 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2168 140.459 93.5894 131.087L143.794 80.8822" stroke="currentColor" stroke-width="16" stroke-linecap="round"/>' },

  library:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  plug:'<path d="M9 2v6"/><path d="M15 2v6"/><path d="M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6Z"/><path d="M12 17v5"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
  panel:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 17v5"/>',
  share:'<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/>',

  /* arrows + carets */
  arrowup:'<path d="M12 20V5"/><path d="M5.5 11.5 12 5l6.5 6.5"/>',
  arrowdown:'<path d="M12 4v15"/><path d="M18.5 12.5 12 19l-6.5-6.5"/>',
  arrowright:'<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  chevdown:'<path d="m6 9 6 6 6-6"/>',
  chevup:'<path d="m6 15 6-6 6 6"/>',
  chevleft:'<path d="m15 18-6-6 6-6"/>',
  chevright:'<path d="m9 18 6-6-6-6"/>',
  expand:'<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/>',
  collapse:'<path d="M3 8h3a2 2 0 0 0 2-2V3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/>',
  external:'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3.4 9.2h17.2"/><path d="M3.4 14.8h17.2"/><path d="M12 3a15.5 15.5 0 0 1 0 18"/><path d="M12 3a15.5 15.5 0 0 0 0 18"/>',
  monitor:'<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M9 20.5h6"/><path d="M12 16.5v4"/>',
  /* the unchecked state of a multi-select option; `circle` is its single-select twin */
  square:'<rect x="4" y="4" width="16" height="16" rx="3"/>',

  /* actions */
  close:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
  edit:'<path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
  trash:'<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  dots:'<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  pin:'<path d="M12 17v5"/><path d="M9 10.8V4h6v6.8l3 3.2H6Z"/>',
  branch:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M18 9v1a3 3 0 0 1-3 3H9a3 3 0 0 0-3 3v-1"/>',
  speaker:'<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19.5 5.5a9 9 0 0 1 0 13"/>',
  thumbup:'<path d="M7 22V11"/><path d="M18 11h-4l1.2-4.2A2 2 0 0 0 13.3 4L7 11v11h9.4a2 2 0 0 0 2-1.6l1.4-7A2 2 0 0 0 18 11Z"/>',
  thumbdown:'<path d="M17 2v11"/><path d="M6 13h4l-1.2 4.2A2 2 0 0 0 10.7 20L17 13V2H7.6a2 2 0 0 0-2 1.6l-1.4 7A2 2 0 0 0 6 13Z"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',

  /* status */
  alert:'<path d="M12 9v4"/><path d="M10.3 3.9 2.5 17.3A2 2 0 0 0 4.2 20.3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  lock:'<rect x="4" y="10.5" width="16" height="11" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.9"/>',
  circle:'<circle cx="12" cy="12" r="9"/>',

  /* content types */
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  folder:'<path d="M20 20a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7.1a2 2 0 0 1-1.7-.9l-.9-1.2A2 2 0 0 0 8.6 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/>',
  table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M9 10v10"/>',
  chart:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 15l3.5-4 3 2.5L18 8"/>',
  bars:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12.5" y="7" width="3" height="10" rx="1"/><rect x="18" y="13" width="3" height="4" rx="1"/>',
  flow:'<rect x="8.5" y="2.5" width="7" height="5" rx="1.5"/><rect x="2.5" y="16.5" width="7" height="5" rx="1.5"/><rect x="14.5" y="16.5" width="7" height="5" rx="1.5"/><path d="M12 7.5v4"/><path d="M6 16.5v-3a1.5 1.5 0 0 1 1.5-1.5h9a1.5 1.5 0 0 1 1.5 1.5v3"/>',
  timeline:'<path d="M6 3v18"/><circle cx="6" cy="7" r="2"/><circle cx="6" cy="17" r="2"/><path d="M11 7h9"/><path d="M11 17h6"/>',
  compare:'<path d="M12 3v18"/><path d="M4 8h5"/><path d="M4 13h5"/><path d="M15 8h5"/><path d="M15 13h5"/>',
  grid:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  checklist:'<path d="M3.5 6.5 5 8l2.5-2.5"/><path d="M3.5 16.5 5 18l2.5-2.5"/><path d="M11 7h10"/><path d="M11 17h10"/>',
  code:'<path d="m8 17-5-5 5-5"/><path d="m16 7 5 5-5 5"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.8"/><path d="m21 15-4.5-4.5L7 20"/>',
  quote:'<path d="M9 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1.5c0 2-.8 3-2.5 3.5"/><path d="M19 7h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1.5c0 2-.8 3-2.5 3.5"/>',

  /* people + org */
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16.5 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.2A7 7 0 0 1 22 21"/>',
  building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h.01"/><path d="M15 8h.01"/><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 21v-4h4v4"/>',
  mail:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6.5 9 6 9-6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',

  /* concepts */
  spark:'<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4Z"/><path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/>',
  brain:'<path d="M12 5.5A3 3 0 0 0 6.5 4 3 3 0 0 0 4 8.5a3.2 3.2 0 0 0-.5 5A3 3 0 0 0 6 19a3 3 0 0 0 6 .5Z"/><path d="M12 5.5A3 3 0 0 1 17.5 4 3 3 0 0 1 20 8.5a3.2 3.2 0 0 1 .5 5A3 3 0 0 1 18 19a3 3 0 0 1-6 .5Z"/><path d="M12 5.5v14"/>',
  database:'<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  zap:'<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12Z"/>',
  trendup:'<path d="M22 7 13.5 15.5 9 11l-7 7"/><path d="M16 7h6v6"/>',
  trenddown:'<path d="M22 17 13.5 8.5 9 13l-7-7"/><path d="M16 17h6v-6"/>',
  minus:'<path d="M5 12h14"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.2 9.2a3 3 0 0 1 5.8 1c0 2-3 2.6-3 2.6"/><path d="M12 17h.01"/>',
  sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>',
  moon:'<path d="M21 13.4A9 9 0 0 1 10.6 3 9 9 0 1 0 21 13.4Z"/>',
  filter:'<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
  key:'<circle cx="7.5" cy="15.5" r="4"/><path d="m10.5 12.5 8-8"/><path d="m16 7 2.5 2.5"/><path d="m19 4 2 2"/>',
  route:'<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h6a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h3"/>',

  ghost:'<path d="M12 2a7 7 0 0 0-7 7v11l2.5-2 2.25 2 2.25-2 2.25 2 2.25-2 2.5 2V9a7 7 0 0 0-7-7Z"/><path d="M9.5 10h.01"/><path d="M14.5 10h.01"/>',
  /* solid, so it reads as "stop" rather than another outline glyph */
  stop:{ f:true, d:'<rect x="6.5" y="6.5" width="11" height="11" rx="2.6" fill="currentColor"/>' },

  /* library rail */
  star:'<path d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.6l6.5-.9Z"/>',
  grip:'<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>',
  updown:'<path d="M7 15l3 3 3-3"/><path d="M10 18V6"/><path d="M17 9l-3-3-3 3"/><path d="M14 6v12"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 9 5-5 5 5"/><path d="M12 4v12"/>',
};

const Icons = {
  svg(name, cls){
    const raw = ICON_PATHS[name] || ICON_PATHS.circle;
    const def = (typeof raw === "string") ? { d: raw } : raw;
    const view = def.v || "0 0 24 24";
    const paint = def.f
      ? 'fill="none"'   /* fill-based: the paths carry their own fill="currentColor" */
      : `fill="none" stroke="currentColor" stroke-width="${def.w || 1.6}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<svg viewBox="${view}" ${paint}${cls?` class="${cls}"`:""} aria-hidden="true">${def.d}</svg>`;
  },
  /* inline span, ready to drop into any template string */
  el(name, cls){
    return `<span class="i${cls?" "+cls:""}">${Icons.svg(name)}</span>`;
  },
  has(name){ return Object.prototype.hasOwnProperty.call(ICON_PATHS, name); },
  /* replace every <span class="i" data-icon="x"> in a subtree */
  hydrate(root){
    (root || document).querySelectorAll("[data-icon]").forEach(el => {
      const n = el.getAttribute("data-icon");
      el.innerHTML = Icons.svg(n);
      el.removeAttribute("data-icon");
    });
  },
};
