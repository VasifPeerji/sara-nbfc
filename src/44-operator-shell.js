/* ==================================================================
   44-operator-shell.js
   The operator machine: Windows 11 running Google Chrome.
   ------------------------------------------------------------------
   This file is the machine and the browser. What the browser is
   looking at lives in 45-operator-sap.js, which owns every
   DMS screen and the anchor map that tells the pointer which control
   each step acts on.

   Everything inside the page is authored in a 1280 x 720 coordinate
   space and scaled to fit, so the application keeps real proportions
   at any panel width.

   The icon set below is carried over unchanged from the marketing
   Operator: current-generation Windows 11 and Chrome marks, which is
   what stops the session reading as a mock at first glance.
   ================================================================== */

const OP_STAGE_W = 1280;
const OP_STAGE_H = 720;   /* the page area of a 1280x800 screen */

/* ------------------------------ icons ------------------------------
   Current-generation marks: Windows 11 (22H2+) system icons, the flat
   Chrome logo and the shipping product logos. Anything drawn from an
   older generation reads immediately as a mock, so these follow the
   present-day geometry rather than a remembered one.
------------------------------------------------------------------ */
const OP_ICON = {
  /* Google Chrome. Vector by svgstack.com, attribution recorded in
     docs/IMAGE_CREDITS.md. Scaled from its 100px artboard */
  chrome:
    '<svg viewBox="0 0 24 24"><g transform="scale(.24)"><g clip-path="url(#opCr3)"><path d="M50 74.9895C63.8071 74.9895 75 63.7966 75 49.9895C75 36.1824 63.8071 24.9895 50 24.9895C36.1929 24.9895 25 36.1824 25 49.9895C25 63.7966 36.1929 74.9895 50 74.9895Z" fill="white"/><path d="M50 25.0005H93.2942C88.9071 17.3992 82.596 11.0869 74.9955 6.69838C67.3951 2.30985 58.7731 -0.000246019 49.9967 0.000366333C41.2202 0.000978684 32.5986 2.31228 24.9988 6.70187C17.3989 11.0915 11.0887 17.4046 6.7027 25.0065L28.3498 62.5005L28.3692 62.4955C26.1671 58.6981 25.005 54.3873 25.0001 49.9977C24.9951 45.608 26.1475 41.2946 28.3411 37.4923C30.5346 33.69 33.6918 30.5332 37.4943 28.3401C41.2968 26.147 45.6103 24.995 50 25.0005Z" fill="url(#opCr0)"/><path d="M50 69.7922C60.9306 69.7922 69.7916 60.9312 69.7916 50.0005C69.7916 39.0699 60.9306 30.2089 50 30.2089C39.0693 30.2089 30.2083 39.0699 30.2083 50.0005C30.2083 60.9312 39.0693 69.7922 50 69.7922Z" fill="#1A73E8"/><path d="M71.6485 62.5065L50.0014 100C58.7779 100.002 67.3999 97.6922 75.0007 93.3042C82.6014 88.9163 88.9129 82.6045 93.3006 75.0036C97.6882 67.4026 99.9974 58.7805 99.9958 50.0041C99.9942 41.2276 97.682 32.6063 93.2917 25.007H49.9977L49.9925 25.0263C54.3822 25.0179 58.6965 26.1668 62.5005 28.3573C66.3046 30.5479 69.4639 33.7026 71.66 37.5034C73.8561 41.3042 75.0114 45.6168 75.0094 50.0065C75.0074 54.3962 73.8481 58.7077 71.6485 62.5065Z" fill="url(#opCr1)"/><path d="M28.3512 62.5069L6.70414 25.0129C2.31482 32.6129 0.00380611 41.2346 0.00347904 50.0111C0.00315197 58.7875 2.31352 67.4094 6.70228 75.0097C11.091 82.61 17.4035 88.9209 25.0049 93.3078C32.6063 97.6947 41.2287 100.003 50.0052 100L71.6523 62.5065L71.6383 62.4923C69.4507 66.2981 66.2985 69.4598 62.4994 71.6589C58.7003 73.858 54.3886 75.0167 49.999 75.0182C45.6093 75.0197 41.2968 73.8639 37.4963 71.6674C33.6957 69.4708 30.5414 66.3112 28.3512 62.5069Z" fill="url(#opCr2)"/></g><defs><linearGradient id="opCr0" x1="6.7027" y1="31.2505" x2="93.2942" y2="31.2505" gradientUnits="userSpaceOnUse"><stop stop-color="#D93025"/><stop offset="1" stop-color="#EA4335"/></linearGradient><linearGradient id="opCr1" x1="43.1706" y1="99.332" x2="86.4664" y2="24.3415" gradientUnits="userSpaceOnUse"><stop stop-color="#FCC934"/><stop offset="1" stop-color="#FBBC04"/></linearGradient><linearGradient id="opCr2" x1="55.4127" y1="96.8786" x2="12.1169" y2="21.8879" gradientUnits="userSpaceOnUse"><stop stop-color="#1E8E3E"/><stop offset="1" stop-color="#34A853"/></linearGradient><clipPath id="opCr3"><rect width="100" height="100" fill="white" transform="translate(0 0.000488281)"/></clipPath></defs></g></svg>',
  /* Windows 11 start: four equal squares, one blue, slight rounding */
  windows:
    '<svg viewBox="0 0 24 24"><defs><linearGradient id="opWinG" x1="3" y1="3" x2="21" y2="21">' +
    '<stop stop-color="#0F8BE9"/><stop offset="1" stop-color="#0A63CE"/></linearGradient></defs>' +
    '<rect x="3" y="3" width="8.4" height="8.4" rx=".7" fill="url(#opWinG)"/>' +
    '<rect x="12.6" y="3" width="8.4" height="8.4" rx=".7" fill="url(#opWinG)"/>' +
    '<rect x="3" y="12.6" width="8.4" height="8.4" rx=".7" fill="url(#opWinG)"/>' +
    '<rect x="12.6" y="12.6" width="8.4" height="8.4" rx=".7" fill="url(#opWinG)"/></svg>',
  /* Windows 11 task view */
  taskview:
    '<svg viewBox="0 0 24 24"><rect x="2.4" y="5.4" width="12.2" height="13.2" rx="1.9" fill="none" ' +
    'stroke="#2A3542" stroke-width="1.5"/><path d="M17.4 7.2h1.2a2 2 0 0 1 2 2v5.6a2 2 0 0 1-2 2h-1.2" ' +
    'fill="none" stroke="#2A3542" stroke-width="1.5" stroke-linecap="round"/></svg>',
  /* Windows 11 File Explorer */
  explorer:
    '<svg viewBox="0 0 24 24"><defs><linearGradient id="opFeA" x1="2" y1="4" x2="9" y2="10"><stop stop-color="#E4A32B"/><stop offset="1" stop-color="#D9971F"/></linearGradient><linearGradient id="opFeB" x1="4" y1="7" x2="19" y2="21"><stop stop-color="#FFD65C"/><stop offset=".55" stop-color="#FCC63F"/><stop offset="1" stop-color="#F7BC33"/></linearGradient></defs><path fill="url(#opFeA)" d="M1.6 5.5c0-1 .8-1.8 1.8-1.8h4.9c.6 0 1.1.2 1.5.7l1.9 2.2H21c1 0 1.8.8 1.8 1.8v3H1.6Z"/><path fill="url(#opFeB)" d="M1.6 8.1c0-1 .8-1.8 1.8-1.8H21c1 0 1.8.8 1.8 1.8v10.5c0 1-.8 1.8-1.8 1.8H3.4c-1 0-1.8-.8-1.8-1.8Z"/><path fill="#F6C95A" d="M6.4 17.4c0-1.3 1-2.3 2.3-2.3h7.2c1.3 0 2.3 1 2.3 2.3v3h-11.8Z"/><path fill="#0C7CD5" d="M7.4 18.1c0-1.1.9-2 2-2h5.9c1.1 0 2 .9 2 2v2.3H7.4Z"/><rect x="9.3" y="18.6" width="6.1" height=".62" rx=".31" fill="#3B2E96"/></svg>',
  /* Microsoft Edge, shipping mark */
  edge:
    '<svg viewBox="0 0 24 24"><g transform="scale(.09375)"><defs><radialGradient id="opEg0" cx="161.83" cy="788.401" r="95.38" gradientTransform="matrix(.9999 0 0 .9498 -4.622 -570.387)" gradientUnits="userSpaceOnUse"><stop offset=".72" stop-opacity="0"></stop><stop offset=".95" stop-opacity=".53"></stop><stop offset="1"></stop></radialGradient><radialGradient id="opEg1" cx="-773.636" cy="746.715" r="143.24" gradientTransform="matrix(.15 -.9898 .8 .12 -410.718 -656.341)" gradientUnits="userSpaceOnUse"><stop offset=".76" stop-opacity="0"></stop><stop offset=".95" stop-opacity=".5"></stop><stop offset="1"></stop></radialGradient><radialGradient id="opEg2" cx="230.593" cy="-106.038" r="202.43" gradientTransform="matrix(-.04 .9998 -2.1299 -.07998 -190.775 -191.635)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#35c1f1"></stop><stop offset=".11" stop-color="#34c1ed"></stop><stop offset=".23" stop-color="#2fc2df"></stop><stop offset=".31" stop-color="#2bc3d2"></stop><stop offset=".67" stop-color="#36c752"></stop></radialGradient><radialGradient id="opEg5" cx="536.357" cy="-117.703" r="97.34" gradientTransform="matrix(.28 .9598 -.78 .23 -1.928 -410.318)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#66eb6e"></stop><stop offset="1" stop-color="#66eb6e" stop-opacity="0"></stop></radialGradient><linearGradient id="opEg4" x1="63.334" x2="241.617" y1="757.83" y2="757.83" gradientTransform="translate(-4.63 -580.81)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0c59a4"></stop><stop offset="1" stop-color="#114a8b"></stop></linearGradient><linearGradient id="opEg3" x1="157.401" x2="46.028" y1="680.556" y2="801.868" gradientTransform="translate(-4.63 -580.81)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1b9de2"></stop><stop offset=".16" stop-color="#1595df"></stop><stop offset=".67" stop-color="#0680d7"></stop><stop offset="1" stop-color="#0078d4"></stop></linearGradient></defs><path fill="url(#opEg4)" d="M231 190.5c-3.4 1.8-6.9 3.4-10.5 4.7c-11.5 4.3-23.6 6.5-35.9 6.5c-47.3 0-88.5-32.5-88.5-74.3c.1-11.4 6.4-21.9 16.4-27.3c-42.8 1.8-53.8 46.4-53.8 72.5c0 73.9 68.1 81.4 82.8 81.4c7.9 0 19.8-2.3 27-4.6l1.3-.4c27.6-9.5 51-28.1 66.6-52.8c1.2-1.9.6-4.3-1.2-5.5c-1.3-.8-2.9-.9-4.2-.2"></path><path fill="url(#opEg0)" d="M231 190.5c-3.4 1.8-6.9 3.4-10.5 4.7c-11.5 4.3-23.6 6.5-35.9 6.5c-47.3 0-88.5-32.5-88.5-74.3c.1-11.4 6.4-21.9 16.4-27.3c-42.8 1.8-53.8 46.4-53.8 72.5c0 73.9 68.1 81.4 82.8 81.4c7.9 0 19.8-2.3 27-4.6l1.3-.4c27.6-9.5 51-28.1 66.6-52.8c1.2-1.9.6-4.3-1.2-5.5c-1.3-.8-2.9-.9-4.2-.2" opacity=".35"></path><path fill="url(#opEg3)" d="M105.7 241.4c-8.9-5.5-16.6-12.8-22.7-21.3c-26.3-36-18.4-86.5 17.6-112.8c3.8-2.7 7.7-5.2 11.9-7.2c3.1-1.5 8.4-4.1 15.5-4c10.1.1 19.6 4.9 25.7 13c4 5.4 6.3 11.9 6.4 18.7c0-.2 24.5-79.6-80-79.6c-43.9 0-80 41.7-80 78.2c-.2 19.3 4 38.5 12.1 56c27.6 58.8 94.8 87.6 156.4 67.1c-21.1 6.6-44.1 3.7-62.9-8.1"></path><path fill="url(#opEg1)" d="M105.7 241.4c-8.9-5.5-16.6-12.8-22.7-21.3c-26.3-36-18.4-86.5 17.6-112.8c3.8-2.7 7.7-5.2 11.9-7.2c3.1-1.5 8.4-4.1 15.5-4c10.1.1 19.6 4.9 25.7 13c4 5.4 6.3 11.9 6.4 18.7c0-.2 24.5-79.6-80-79.6c-43.9 0-80 41.7-80 78.2c-.2 19.3 4 38.5 12.1 56c27.6 58.8 94.8 87.6 156.4 67.1c-21.1 6.6-44.1 3.7-62.9-8.1" opacity=".41"></path><path fill="url(#opEg2)" d="M152.3 148.9c-.8 1-3.3 2.5-3.3 5.7c0 2.6 1.7 5.1 4.7 7.2c14.4 10 41.5 8.7 41.6 8.7c10.7 0 21.1-2.9 30.3-8.3c18.8-11 30.4-31.1 30.4-52.9c.3-22.4-8-37.3-11.3-43.9C223.5 23.9 177.7 0 128 0C58 0 1 56.2 0 126.2c.5-36.5 36.8-66 80-66c3.5 0 23.5.3 42 10.1c16.3 8.6 24.9 18.9 30.8 29.2c6.2 10.7 7.3 24.1 7.3 29.5c0 5.3-2.7 13.3-7.8 19.9"></path><path fill="url(#opEg5)" d="M152.3 148.9c-.8 1-3.3 2.5-3.3 5.7c0 2.6 1.7 5.1 4.7 7.2c14.4 10 41.5 8.7 41.6 8.7c10.7 0 21.1-2.9 30.3-8.3c18.8-11 30.4-31.1 30.4-52.9c.3-22.4-8-37.3-11.3-43.9C223.5 23.9 177.7 0 128 0C58 0 1 56.2 0 126.2c.5-36.5 36.8-66 80-66c3.5 0 23.5.3 42 10.1c16.3 8.6 24.9 18.9 30.8 29.2c6.2 10.7 7.3 24.1 7.3 29.5c0 5.3-2.7 13.3-7.8 19.9"></path></g></svg>',
  /* Outlook, the 2025 mark */
  outlook:
    '<svg viewBox="0 0 24 24"><g transform="translate(0 .63892) scale(.0421) translate(-60 -90.4)"><defs><linearGradient id="opOl10" gradientUnits="userSpaceOnUse" x1="9.98908" y1="22.364901" x2="30.932199" y2="9.37495" gradientTransform="matrix(15,0,0,15,0,0)"><stop offset="0" style="stop-color:rgb(12.54902%,65.490196%,98.039216%);stop-opacity:1;"/><stop offset="0.4" style="stop-color:rgb(23.137255%,83.529412%,100%);stop-opacity:1;"/><stop offset="1" style="stop-color:rgb(76.862745%,69.019608%,100%);stop-opacity:1;"/></linearGradient><linearGradient id="opOl6" gradientUnits="userSpaceOnUse" x1="17.197201" y1="26.7945" x2="28.856199" y2="8.12575" gradientTransform="matrix(15,0,0,15,0,0)"><stop offset="0" style="stop-color:rgb(8.627451%,35.294118%,85.098039%);stop-opacity:1;"/><stop offset="0.5008" style="stop-color:rgb(9.411765%,50.196078%,89.803922%);stop-opacity:1;"/><stop offset="1" style="stop-color:rgb(52.156863%,52.941176%,100%);stop-opacity:1;"/></linearGradient><linearGradient id="opOl12" gradientUnits="userSpaceOnUse" x1="25.7005" y1="27.048401" x2="12.7563" y2="16.501301" gradientTransform="matrix(15,0,0,15,0,0)"><stop offset="0.236946" style="stop-color:rgb(26.666667%,54.117647%,100%);stop-opacity:0;"/><stop offset="0.792113" style="stop-color:rgb(0%,19.607843%,69.411765%);stop-opacity:0.2;"/></linearGradient><linearGradient id="opOl5" gradientUnits="userSpaceOnUse" x1="24.0534" y1="31.1099" x2="44.509998" y2="18.0177" gradientTransform="matrix(15,0,0,15,0,0)"><stop offset="0" style="stop-color:rgb(10.196078%,26.27451%,65.098039%);stop-opacity:1;"/><stop offset="0.492267" style="stop-color:rgb(12.54902%,32.156863%,79.607843%);stop-opacity:1;"/><stop offset="1" style="stop-color:rgb(37.254902%,12.54902%,79.607843%);stop-opacity:1;"/></linearGradient><linearGradient id="opOl4" gradientUnits="userSpaceOnUse" x1="29.8281" y1="30.327299" x2="17.397499" y2="19.570801" gradientTransform="matrix(15,0,0,15,0,0)"><stop offset="0" style="stop-color:rgb(0%,27.058824%,72.54902%);stop-opacity:0;"/><stop offset="0.669859" style="stop-color:rgb(5.098039%,12.156863%,41.176471%);stop-opacity:0.2;"/></linearGradient><radialGradient id="opOl9" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(0.000000000000024802,-405.040512,438.393002,0.000000000000026844,360.027008,102.268202)"><stop offset="0.568182" style="stop-color:rgb(15.294118%,37.254902%,94.117647%);stop-opacity:0;"/><stop offset="0.992424" style="stop-color:rgb(0%,12.941176%,46.666667%);stop-opacity:1;"/></radialGradient><linearGradient id="opOl2" gradientUnits="userSpaceOnUse" x1="41.998001" y1="29.9431" x2="23.8517" y2="29.9431" gradientTransform="matrix(15,0,0,15,0,0)"><stop offset="0" style="stop-color:rgb(30.196078%,76.862745%,100%);stop-opacity:1;"/><stop offset="0.196145" style="stop-color:rgb(5.882353%,68.627451%,100%);stop-opacity:1;"/></linearGradient><radialGradient id="opOl13" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(122.73959,-122.73959,122.73959,122.73959,421.392002,568.675518)"><stop offset="0.259477" style="stop-color:rgb(0%,37.647059%,81.960784%);stop-opacity:0.4;"/><stop offset="0.908166" style="stop-color:rgb(1.176471%,51.372549%,94.509804%);stop-opacity:0;"/></radialGradient><radialGradient id="opOl7" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(357.407022,-468.445926,423.594568,323.187085,159.471002,697.080002)"><stop offset="0.732317" style="stop-color:rgb(95.686275%,65.490196%,96.862745%);stop-opacity:0;"/><stop offset="1" style="stop-color:rgb(95.686275%,65.490196%,96.862745%);stop-opacity:0.501961;"/></radialGradient><radialGradient id="opOl3" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-170.860868,259.725406,-674.018133,-443.404152,278.562012,412.978506)"><stop offset="0" style="stop-color:rgb(28.627451%,87.058824%,100%);stop-opacity:1;"/><stop offset="0.724349" style="stop-color:rgb(16.078431%,76.470588%,100%);stop-opacity:1;"/></radialGradient><linearGradient id="opOl1" gradientUnits="userSpaceOnUse" x1="3.45756" y1="37.872299" x2="20.9291" y2="37.859699" gradientTransform="matrix(15,0,0,15,0,0)"><stop offset="0.205882" style="stop-color:rgb(42.352941%,87.843137%,100%);stop-opacity:1;"/><stop offset="0.535" style="stop-color:rgb(31.372549%,83.529412%,100%);stop-opacity:0;"/></linearGradient><radialGradient id="opOl8" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(215.76719,230.769125,-230.769125,215.76719,59.143649,354.231005)"><stop offset="0.038877" style="stop-color:rgb(0%,56.862745%,100%);stop-opacity:1;"/><stop offset="0.919119" style="stop-color:rgb(9.411765%,23.921569%,67.843137%);stop-opacity:1;"/></radialGradient><radialGradient id="opOl11" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(0.000000000000010287,167.999997,-193.782005,0.000000000000011866,180,491.158504)"><stop offset="0.557796" style="stop-color:rgb(5.882353%,64.705882%,96.862745%);stop-opacity:0;"/><stop offset="1" style="stop-color:rgb(45.490196%,77.647059%,100%);stop-opacity:0.501961;"/></radialGradient></defs><g id="opOl0"><path fill-rule="nonzero" fill="url(#opOl10)" d="M 463.984375 140.144531 L 119.636719 358.414062 L 90.023438 311.695312 L 90.023438 271.4375 C 90.023438 256.78125 97.445312 243.121094 109.742188 235.144531 L 309.910156 105.257812 C 340.40625 85.46875 379.6875 85.464844 410.1875 105.25 Z M 463.984375 140.144531 "/><path fill-rule="nonzero" fill="url(#opOl6)" d="M 407.101562 103.339844 C 408.136719 103.953125 409.164062 104.59375 410.183594 105.253906 L 566.398438 206.585938 L 179.0625 452.105469 L 119.625 358.335938 L 403.894531 177.800781 C 430.820312 160.699219 432 122.230469 407.101562 103.339844 Z M 407.101562 103.339844 "/><path fill-rule="nonzero" fill="url(#opOl12)" d="M 407.101562 103.339844 C 408.136719 103.953125 409.164062 104.59375 410.183594 105.253906 L 566.398438 206.585938 L 179.0625 452.105469 L 119.625 358.335938 L 403.894531 177.800781 C 430.820312 160.699219 432 122.230469 407.101562 103.339844 Z M 407.101562 103.339844 "/><path fill-rule="nonzero" fill="url(#opOl5)" d="M 333.601562 498.988281 L 179.066406 452.109375 L 507.628906 243.835938 C 535.300781 226.296875 535.230469 185.898438 507.496094 168.457031 L 506.015625 167.527344 L 510.277344 170.175781 L 610.273438 235.042969 C 622.574219 243.019531 629.996094 256.683594 629.996094 271.34375 L 629.996094 310.304688 Z M 333.601562 498.988281 "/><path fill-rule="nonzero" fill="url(#opOl4)" d="M 333.601562 498.988281 L 179.066406 452.109375 L 507.628906 243.835938 C 535.300781 226.296875 535.230469 185.898438 507.496094 168.457031 L 506.015625 167.527344 L 510.277344 170.175781 L 610.273438 235.042969 C 622.574219 243.019531 629.996094 256.683594 629.996094 271.34375 L 629.996094 310.304688 Z M 333.601562 498.988281 "/><path fill-rule="nonzero" fill="url(#opOl9)" d="M 410.1875 105.25 C 379.6875 85.464844 340.40625 85.46875 309.90625 105.257812 L 109.742188 235.144531 C 97.445312 243.121094 90.023438 256.78125 90.023438 271.4375 L 90.023438 273.40625 C 90.507812 288.121094 98.25 301.679688 110.757812 309.566406 L 359.644531 466.476562 L 609.160156 309.804688 C 622.121094 301.667969 629.984375 287.441406 629.984375 272.140625 L 629.984375 310.308594 L 629.992188 271.34375 C 629.992188 256.683594 622.566406 243.023438 610.269531 235.042969 Z M 410.1875 105.25 "/><path fill-rule="nonzero" fill="url(#opOl2)" d="M 315.769531 630.050781 L 536.21875 630.050781 C 587.996094 630.050781 629.96875 588.078125 629.96875 536.300781 L 629.96875 272.140625 C 629.96875 287.441406 622.105469 301.667969 609.148438 309.804688 L 281.242188 515.695312 C 263.554688 526.804688 252.820312 546.222656 252.820312 567.109375 C 252.824219 601.871094 281.003906 630.050781 315.769531 630.050781 Z M 315.769531 630.050781 "/><path fill-rule="nonzero" fill="url(#opOl13)" d="M 315.769531 630.050781 L 536.21875 630.050781 C 587.996094 630.050781 629.96875 588.078125 629.96875 536.300781 L 629.96875 272.140625 C 629.96875 287.441406 622.105469 301.667969 609.148438 309.804688 L 281.242188 515.695312 C 263.554688 526.804688 252.820312 546.222656 252.820312 567.109375 C 252.824219 601.871094 281.003906 630.050781 315.769531 630.050781 Z M 315.769531 630.050781 "/><path fill-rule="nonzero" fill="url(#opOl7)" d="M 315.769531 630.050781 L 536.21875 630.050781 C 587.996094 630.050781 629.96875 588.078125 629.96875 536.300781 L 629.96875 272.140625 C 629.96875 287.441406 622.105469 301.667969 609.148438 309.804688 L 281.242188 515.695312 C 263.554688 526.804688 252.820312 546.222656 252.820312 567.109375 C 252.824219 601.871094 281.003906 630.050781 315.769531 630.050781 Z M 315.769531 630.050781 "/><path fill-rule="nonzero" fill="url(#opOl3)" d="M 405.402344 630.035156 L 183.738281 630.035156 C 131.960938 630.035156 89.988281 588.0625 89.988281 536.285156 L 89.988281 271.945312 C 89.988281 287.21875 97.824219 301.421875 110.742188 309.566406 L 438.324219 516.085938 C 456.257812 527.390625 467.132812 547.113281 467.132812 568.3125 C 467.128906 602.402344 439.492188 630.035156 405.402344 630.035156 Z M 405.402344 630.035156 "/><path fill-rule="nonzero" fill="url(#opOl1)" d="M 405.402344 630.035156 L 183.738281 630.035156 C 131.960938 630.035156 89.988281 588.0625 89.988281 536.285156 L 89.988281 271.945312 C 89.988281 287.21875 97.824219 301.421875 110.742188 309.566406 L 438.324219 516.085938 C 456.257812 527.390625 467.132812 547.113281 467.132812 568.3125 C 467.128906 602.402344 439.492188 630.035156 405.402344 630.035156 Z M 405.402344 630.035156 "/><path fill-rule="nonzero" fill="url(#opOl8)" d="M 108.75 345 L 251.25 345 C 278.175781 345 300 366.824219 300 393.75 L 300 536.25 C 300 563.175781 278.175781 585 251.25 585 L 108.75 585 C 81.824219 585 60 563.175781 60 536.25 L 60 393.75 C 60 366.824219 81.824219 345 108.75 345 Z M 108.75 345 "/><path fill-rule="nonzero" fill="url(#opOl11)" d="M 108.75 345 L 251.25 345 C 278.175781 345 300 366.824219 300 393.75 L 300 536.25 C 300 563.175781 278.175781 585 251.25 585 L 108.75 585 C 81.824219 585 60 563.175781 60 536.25 L 60 393.75 C 60 366.824219 81.824219 345 108.75 345 Z M 108.75 345 "/><path fill-rule="nonzero" fill="#fff" d="M 179.386719 534 C 159.539062 534 143.25 527.789062 130.511719 515.375 C 117.773438 502.960938 111.402344 486.757812 111.402344 466.769531 C 111.402344 445.660156 117.867188 428.589844 130.796875 415.550781 C 143.730469 402.515625 160.660156 396 181.59375 396 C 201.375 396 217.472656 402.238281 229.890625 414.714844 C 242.375 427.191406 248.617188 443.644531 248.617188 464.066406 C 248.617188 485.050781 242.148438 501.964844 229.21875 514.816406 C 216.351562 527.605469 199.742188 534 179.386719 534 Z M 179.960938 507.648438 C 190.777344 507.648438 199.484375 503.953125 206.078125 496.566406 C 212.671875 489.179688 215.96875 478.902344 215.96875 465.742188 C 215.96875 452.023438 212.765625 441.347656 206.367188 433.710938 C 199.964844 426.074219 191.417969 422.257812 180.730469 422.257812 C 169.71875 422.257812 160.851562 426.199219 154.132812 434.082031 C 147.410156 441.90625 144.050781 452.273438 144.050781 465.183594 C 144.050781 478.285156 147.410156 488.652344 154.132812 496.285156 C 160.851562 503.859375 169.460938 507.648438 179.960938 507.648438 Z M 179.960938 507.648438 "/><path fill-rule="nonzero" fill="#fff" d="M 179.332031 535.847656 C 159.5625 535.847656 143.332031 529.472656 130.640625 516.71875 C 117.953125 503.964844 111.605469 487.320312 111.605469 466.789062 C 111.605469 445.105469 118.046875 427.570312 130.929688 414.179688 C 143.8125 400.785156 160.679688 394.089844 181.53125 394.089844 C 201.234375 394.089844 217.273438 400.5 229.644531 413.316406 C 242.082031 426.136719 248.296875 443.035156 248.296875 464.015625 C 248.296875 485.566406 241.855469 502.945312 228.976562 516.144531 C 216.15625 529.28125 199.609375 535.847656 179.332031 535.847656 Z M 179.902344 508.78125 C 190.679688 508.78125 199.355469 504.984375 205.921875 497.398438 C 212.492188 489.808594 215.773438 479.253906 215.773438 465.734375 C 215.773438 451.640625 212.585938 440.675781 206.210938 432.832031 C 199.832031 424.988281 191.320312 421.066406 180.671875 421.066406 C 169.699219 421.066406 160.867188 425.113281 154.171875 433.214844 C 147.476562 441.246094 144.128906 451.898438 144.128906 465.160156 C 144.128906 478.617188 147.476562 489.265625 154.171875 497.109375 C 160.867188 504.890625 169.445312 508.78125 179.902344 508.78125 Z M 179.902344 508.78125 "/></g></g></svg>',
  /* Microsoft Teams */
  teams:
    '<svg viewBox="0 0 24 24"><g transform="translate(0 .83721) scale(.01077)"><path fill="#5059C9" d="M1554.637,777.5h575.713c54.391,0,98.483,44.092,98.483,98.483c0,0,0,0,0,0v524.398	c0,199.901-162.051,361.952-361.952,361.952h0h-1.711c-199.901,0.028-361.975-162-362.004-361.901c0-0.017,0-0.034,0-0.052V828.971	C1503.167,800.544,1526.211,777.5,1554.637,777.5L1554.637,777.5z"/><circle fill="#5059C9" cx="1943.75" cy="440.583" r="233.25"/><circle fill="#7B83EB" cx="1218.083" cy="336.917" r="336.917"/><path fill="#7B83EB" d="M1667.323,777.5H717.01c-53.743,1.33-96.257,45.931-95.01,99.676v598.105	c-7.505,322.519,247.657,590.16,570.167,598.053c322.51-7.893,577.671-275.534,570.167-598.053V877.176	C1763.579,823.431,1721.066,778.83,1667.323,777.5z"/><path opacity=".1" d="M1244,777.5v838.145c-0.258,38.435-23.549,72.964-59.09,87.598	c-11.316,4.787-23.478,7.254-35.765,7.257H667.613c-6.738-17.105-12.958-34.21-18.142-51.833	c-18.144-59.477-27.402-121.307-27.472-183.49V877.02c-1.246-53.659,41.198-98.19,94.855-99.52H1244z"/><path opacity=".2" d="M1192.167,777.5v889.978c-0.002,12.287-2.47,24.449-7.257,35.765	c-14.634,35.541-49.163,58.833-87.598,59.09H691.975c-8.812-17.105-17.105-34.21-24.362-51.833	c-7.257-17.623-12.958-34.21-18.142-51.833c-18.144-59.476-27.402-121.307-27.472-183.49V877.02	c-1.246-53.659,41.198-98.19,94.855-99.52H1192.167z"/><path opacity=".2" d="M1192.167,777.5v786.312c-0.395,52.223-42.632,94.46-94.855,94.855h-447.84	c-18.144-59.476-27.402-121.307-27.472-183.49V877.02c-1.246-53.659,41.198-98.19,94.855-99.52H1192.167z"/><path opacity=".2" d="M1140.333,777.5v786.312c-0.395,52.223-42.632,94.46-94.855,94.855H649.472	c-18.144-59.476-27.402-121.307-27.472-183.49V877.02c-1.246-53.659,41.198-98.19,94.855-99.52H1140.333z"/><path opacity=".1" d="M1244,509.522v163.275c-8.812,0.518-17.105,1.037-25.917,1.037	c-8.812,0-17.105-0.518-25.917-1.037c-17.496-1.161-34.848-3.937-51.833-8.293c-104.963-24.857-191.679-98.469-233.25-198.003	c-7.153-16.715-12.706-34.071-16.587-51.833h258.648C1201.449,414.866,1243.801,457.217,1244,509.522z"/><path opacity=".2" d="M1192.167,561.355v111.442c-17.496-1.161-34.848-3.937-51.833-8.293	c-104.963-24.857-191.679-98.469-233.25-198.003h190.228C1149.616,466.699,1191.968,509.051,1192.167,561.355z"/><path opacity=".2" d="M1192.167,561.355v111.442c-17.496-1.161-34.848-3.937-51.833-8.293	c-104.963-24.857-191.679-98.469-233.25-198.003h190.228C1149.616,466.699,1191.968,509.051,1192.167,561.355z"/><path opacity=".2" d="M1140.333,561.355v103.148c-104.963-24.857-191.679-98.469-233.25-198.003	h138.395C1097.783,466.699,1140.134,509.051,1140.333,561.355z"/><linearGradient id="opTm0" gradientUnits="userSpaceOnUse" x1="198.099" y1="1683.0726" x2="942.2344" y2="394.2607" gradientTransform="matrix(1 0 0 -1 0 2075.3333)"><stop offset="0" stop-color="#5a62c3"/><stop offset=".5" stop-color="#4d55bd"/><stop offset="1" stop-color="#3940ab"/></linearGradient><path fill="url(#opTm0)" d="M95.01,466.5h950.312c52.473,0,95.01,42.538,95.01,95.01v950.312c0,52.473-42.538,95.01-95.01,95.01	H95.01c-52.473,0-95.01-42.538-95.01-95.01V561.51C0,509.038,42.538,466.5,95.01,466.5z"/><path fill="#FFF" d="M820.211,828.193H630.241v517.297H509.211V828.193H320.123V727.844h500.088V828.193z"/></g></svg>',
  recycle:
    '<svg viewBox="0 0 24 24"><path fill="#9FDCF7" fill-opacity=".92" d="M6 6.6h12l-1.1 13.6a1.6 1.6 0 0 1-1.6 1.5H8.7a1.6 1.6 0 0 1-1.6-1.5Z"/>' +
    '<path fill="#5CB4E0" d="M6 6.6h12l-.2 2.3H6.2Z"/><path fill="none" stroke="#2C6FA0" stroke-width="1" d="M9.6 11v7.6m2.4-7.6v7.6m2.4-7.6v7.6"/>' +
    '<path fill="#D6EEFB" d="M8.6 3.4h6.8l.9 2.6H7.7Z"/></svg>',
  folder:
    '<svg viewBox="0 0 24 24"><defs><linearGradient id="opFldG" x1="3" y1="8" x2="20" y2="20">' +
    '<stop stop-color="#FFD874"/><stop offset="1" stop-color="#FFB92E"/></linearGradient></defs>' +
    '<path fill="#F0A526" d="M2.2 6.6c0-1 .8-1.8 1.8-1.8h4.6c.5 0 1 .2 1.3.6l1.5 1.7H20c1 0 1.8.8 1.8 1.8v1.4H2.2Z"/>' +
    '<path fill="url(#opFldG)" d="M2.2 9.4h19.6v8.2c0 1-.8 1.8-1.8 1.8H4c-1 0-1.8-.8-1.8-1.8Z"/></svg>',
  back:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5m0 0 6-6m-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fwd:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14m0 0-6-6m6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  reload:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" stroke-linecap="round"/><path d="M20.6 4.2v4.6H16" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V7.6a3.5 3.5 0 0 1 7 0v2.9"/></svg>',
  search:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="6.6"/><path d="m16 16 4.4 4.4" stroke-linecap="round"/></svg>',
  star:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8Z" stroke-linejoin="round"/></svg>',
  puzzle:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 4.5a1.9 1.9 0 0 1 3.8 0V6h3.1a1 1 0 0 1 1 1v3.1h1.6a1.9 1.9 0 0 1 0 3.8H18V17a1 1 0 0 1-1 1h-3.2v-1.4a1.9 1.9 0 0 0-3.8 0V18H6.9a1 1 0 0 1-1-1v-3.1H4.4a1.9 1.9 0 0 1 0-3.8h1.5V7a1 1 0 0 1 1-1H10Z" stroke-linejoin="round"/></svg>',
  dots:    '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5.2" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18.8" r="1.7"/></svg>',
  plus:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>',
  close:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/></svg>',
  min:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14"/></svg>',
  max:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5.5" y="5.5" width="13" height="13" rx="1.4"/></svg>',
  wifi:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 19.6 1.6 8.4A15.4 15.4 0 0 1 12 4.4c4 0 7.7 1.5 10.4 4Z" opacity=".92"/></svg>',
  volume:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 9.5h3.4L12 5.6v12.8L7.4 14.5H4Z" stroke-linejoin="round"/><path d="M15.6 9.4a3.6 3.6 0 0 1 0 5.2M18 7a7 7 0 0 1 0 10" stroke-linecap="round"/></svg>',
  battery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2.5" y="8" width="17" height="8" rx="2"/><path d="M21.5 11v2" stroke-linecap="round"/><rect x="4.4" y="9.9" width="10" height="4.2" rx="1" fill="currentColor" stroke="none"/></svg>',
  chevU:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 15 6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  globe:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.6 2.6 2.6 14.6 0 17.2M12 3.4c-2.6 2.6-2.6 14.6 0 17.2"/></svg>',
  google:  '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8.1Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8Z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4Z"/></svg>',
  mic:     '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M12 14.5a3 3 0 0 0 3-3v-5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"/><path fill="#34A853" d="M17.6 11.4a5.6 5.6 0 0 1-11.2 0H4.8a7.2 7.2 0 0 0 6.4 7.1v2.4h1.6v-2.4a7.2 7.2 0 0 0 6.4-7.1Z"/></svg>',
  lens:    '<svg viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="1.8"><circle cx="12" cy="12" r="3.4"/><path d="M4 9V6.5A1.5 1.5 0 0 1 5.5 5H8m8 0h2.5A1.5 1.5 0 0 1 20 6.5V9m0 6v2.5a1.5 1.5 0 0 1-1.5 1.5H16m-8 0H5.5A1.5 1.5 0 0 1 4 17.5V15" stroke-linecap="round"/></svg>'
};

function opIcon(name) { return OP_ICON[name] || ''; }

/* Windows cursors */
const OP_CURSOR = {
  arrow: '<svg viewBox="0 0 24 32"><path d="M4.5 2.4 4.5 24.6 9.9 19.4 13.4 27 17 25.4 13.6 18 20.4 17.6Z" fill="#fff" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  hand: '<svg viewBox="0 0 24 32"><path d="M8.4 15.2V5.9a1.8 1.8 0 0 1 3.6 0v6.4m0-1.6a1.7 1.7 0 0 1 3.4 0v1.6m0-1a1.7 1.7 0 0 1 3.4 0v1.5m0-.7a1.6 1.6 0 0 1 3.2 0v5.6c0 4.6-2.9 8-7.3 8h-1.4c-2.9 0-4.6-1.2-6-3.4l-2.7-4.6c-.6-1-.2-2.1.8-2.6.9-.5 2-.2 2.5.7l.5.9z" fill="#fff" stroke="#000" stroke-width="1.25" stroke-linejoin="round"/></svg>',
  beam: '<svg viewBox="0 0 24 32"><path d="M9 4h6M12 4v24M9 28h6" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/><path d="M9 4h6M12 4v24M9 28h6" stroke="#000" stroke-width="1.8" stroke-linecap="round"/></svg>'
};

/* ==================================================================
   THE MACHINE
   ------------------------------------------------------------------
   One tenant, one estate. The Operator opens Chrome, navigates to
   the tenant's own systems, and works an app journey step by step.

   Nothing here knows what any of those screens look like. It asks
   45-operator-sap.js for a surface and an anchor, and everything
   else — window chrome, address bar, pointer, timing — is generic.
   ================================================================== */

/* The tenant's hosts. An enterprise estate is several systems on
   several hosts, so each app declares its own; `host` may carry a
   {org} token which resolves to the company's own slug. Nothing in
   this file knows which product is being driven. */
/** The system this Operator drives, named by the edition. Nothing in
    this file may hardcode a vendor: the same shell drives an ERP, a
    dispatch console and a supplier portal in this build alone. */
function opSystemName() {
  return (typeof Config !== "undefined" && Config.operatorSystem) || "the system";
}

function opTenantSlug() {
  const c = (typeof Config !== "undefined" && Config.company) || {};
  return String(c.short || c.name || "acme").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function opOrgHost(key) {
  const d = OP_DEPT[key];
  const host = (d && d.host) || (OP_DEPT[OP_ORDER[0]] && OP_DEPT[OP_ORDER[0]].host) || "{org}.example.com";
  return String(host).replace(/\{org\}/g, opTenantSlug());
}

/** Join the host, the app path and the view. A view beginning with #
    is an in-app route (SAP Fiori intent navigation, for one) and must
    not gain a slash in front of it, or the URL reads as a fake. */
function opJoinUrl(host, slug, path) {
  let out = host;
  if (slug) out += "/" + slug;
  if (!path) return out;
  return out + (path.charAt(0) === "#" || path.charAt(0) === "?" ? "" : "/") + path;
}

function opUrlFor(key, view) {
  const dept = OP_DEPT[key];
  if (!dept) return opOrgHost();
  const path = (dept.paths && dept.paths[view]) || dept.paths.home;
  return opJoinUrl(opOrgHost(key), dept.slug, path);
}
function opHomeUrl(key) {
  const dept = OP_DEPT[key];
  return dept ? opJoinUrl(opOrgHost(key), dept.slug, dept.paths.home) : opOrgHost();
}

/* ------------------------------ state ------------------------------ */
function opBlankTab(id) {
  return { id: id, key: "", url: "", title: "New Tab", status: "idle" };
}

function normalizeOperatorState(op) {
  if (!op || !Array.isArray(op.tasks)) {
    op = { running: false, tasks: [], progress: 0, finished: false, manualPreview: false };
  }
  /* what this run was told, what it has asked about, and whether the
     person watching has taken the screen off it */
  if (!op.params) op.params = {};
  if (typeof op.paramsRev !== "number") op.paramsRev = 0;
  if (!Array.isArray(op.chat)) op.chat = [];
  if (op.ask === undefined) op.ask = null;
  if (typeof op.control !== "boolean") op.control = false;
  if (typeof op.paused !== "boolean") op.paused = false;
  if (!Array.isArray(op.tabs) || !op.tabs.length) op.tabs = [opBlankTab("tab-0")];
  if (!op.preview || !op.tabs.some(t => t.id === op.preview)) op.preview = op.tabs[0].id;
  if (typeof op.manualPreview !== "boolean") op.manualPreview = false;
  return op;
}

function opTaskFor(op, key) { return (op.tasks || []).find(t => t.key === key); }
function opSelectedTab(op) { return (op.tabs || []).find(t => t.id === op.preview) || op.tabs[0]; }
function opCurrentTask(op) {
  return (op.tasks || []).find(t => t.status === "running" || t.status === "navigating") ||
    (op.tasks || [])[op.tasks.length - 1] || null;
}

/** Which screen the browser should be showing for a department right now. */
function opViewFor(op, key) {
  const t = opTaskFor(op, key);
  if (!t) return "home";
  if (/^(newtab|address-focus|typing-url|press-enter|loading)$/.test(t.phase)) return "browser-start";
  if (t.status === "done") return "verify";
  const s = t.steps[Math.min(t.index, t.steps.length - 1)];
  return s ? s.view : "home";
}

/** What kind of action a step is. Drives the cursor glyph, whether a
    click is played, and the word shown against the running step.
    Read from the step's own `act` where the journey states one, so a
    reworded label can never silently change the behaviour. */
function opActionKind(step) {
  const explicit = step && step.act;
  if (explicit) {
    const LABEL = { click: "clicking", type: "typing", wait: "processing", inspect: "reviewing", key: "keying" };
    return { type: explicit, label: LABEL[explicit] || "working" };
  }
  const label = String((step && step.label) || "");
  if (/^open /i.test(label)) return { type: "inspect", label: "loading" };
  if (/enter|type|record|describe|key in/i.test(label)) return { type: "type", label: "typing" };
  if (/wait|process|post|run |extract|calculat/i.test(label)) return { type: "wait", label: "processing" };
  if (/verify|review|confirm|check/i.test(label)) return { type: "inspect", label: "reviewing" };
  return { type: "click", label: "clicking" };
}

/* --------------------------- the clock ----------------------------- */
let OP_CLOCK_TIMER = null;
function operatorClockParts() {
  const d = new Date();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).replace(/\s?[AP]M/i, "");
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  return { time: time, date: date };
}
function updateOperatorClock(root) {
  const p = operatorClockParts();
  (root || document).querySelectorAll(".op-win-clock-time").forEach(n => { n.textContent = p.time; });
  (root || document).querySelectorAll(".op-win-clock-date").forEach(n => { n.textContent = p.date; });
}
function scheduleOperatorClock(root) {
  updateOperatorClock(root);
  if (OP_CLOCK_TIMER) return;
  OP_CLOCK_TIMER = setInterval(() => updateOperatorClock(document), 1000);
}

/* ------------------------------ favicon ---------------------------- */
function opFavicon(key) {
  if (!key) return '<span class="opc__fav">' + opIcon("chrome") + "</span>";
  const d = OP_DEPT[key] || {};
  return '<span class="opc__fav opc__fav--tile" style="background:' +
    (d.favBg || "#0070f2") + '">' + esc(d.favMark || "S") + "</span>";
}

/* -------------------------- browser tab strip ---------------------- */
function opBrowserTabs(op) {
  return op.tabs.map(tab => {
    const d = tab.key ? OP_DEPT[tab.key] : null;
    const loading = tab.status === "navigating" && tab.title === "Loading…";
    const title = tab.title || (d ? d.tabTitle : "New Tab");
    return '<button class="opc__tab" data-act="opTab" data-id="' + tab.id + '" aria-selected="' +
      (op.preview === tab.id) + '" title="' + esc(title) + '">' +
      (loading ? '<span class="opc__spin"></span>' : (tab.url && d ? opFavicon(tab.key) : opFavicon(""))) +
      '<span class="opc__tabname">' + esc(title) + "</span>" +
      '<span class="opc__x">' + opIcon("close") + "</span></button>";
  }).join("") +
  '<button class="opc__newtab" aria-label="New tab" title="New tab">' + opIcon("plus") + "</button>";
}

/* ------------------------- Chrome new tab page --------------------- */
function opGoogleSurface(task) {
  const loading = task && task.phase === "loading";
  const host = opOrgHost("");
  /* Chrome's most-visited tiles: the same real sites, in the order a
     machine on this site would actually have worn them in. */
  const shortcuts = OP_SITES.slice(0, 8).map(s =>
    "<span>" + opSiteTile(s) + "<b>" + esc(s.label) + "</b></span>").join("");
  return '<div class="opg">' +
    '<div class="opg__top"><span>Gmail</span><span>Images</span>' +
      '<i class="opg__apps">' + opIcon("dots") + "</i><b>" + esc(opUserInitials()) + "</b></div>" +
    '<div class="opg__mid">' +
      '<div class="opg__logo">' +
        '<span style="color:#4285F4">G</span><span style="color:#EA4335">o</span>' +
        '<span style="color:#FBBC05">o</span><span style="color:#4285F4">g</span>' +
        '<span style="color:#34A853">l</span><span style="color:#EA4335">e</span>' +
      "</div>" +
      '<div class="opg__search">' + opIcon("search") +
        "<span>Search Google or type a URL</span>" +
        "<i>" + opIcon("mic") + "</i><i>" + opIcon("lens") + "</i></div>" +
      '<div class="opg__tiles">' + shortcuts +
        '<span><i class="opg__add">' + opIcon("plus") + "</i><b>Add shortcut</b></span>" +
      "</div>" +
    "</div>" +
    (loading ? '<div class="opg__loading"><span></span>Connecting to ' + esc(host) + "…</div>" : "") +
    "</div>";
}

function opUserInitials() {
  const u = (typeof S !== "undefined" && S.user && S.user.name) || "Operator";
  return u.split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

/* ------------------------- desktop and taskbar --------------------- */
function opDesktopIcons() {
  return '<div class="opw__icons">' +
    '<span class="opw__icon">' + opIcon("recycle") + "<span>Recycle Bin</span></span>" +
    '<span class="opw__icon">' + opIcon("folder") + "<span>Dealership</span></span>" +
    '<span class="opw__icon">' + opIcon("chrome") + "<span>Google Chrome</span></span>" +
  "</div>";
}

/* The app row never changes during a run and the marks it carries are real
   multi-gradient artwork. Serialising them again on every repaint is pure
   waste, so it is built once. */
let OP_TBMID = "";
function opTaskbarApps() {
  if (OP_TBMID) return OP_TBMID;
  OP_TBMID = '<div class="opw__tbmid">' +
    '<span class="opw__tbapp" title="Start">' + opIcon("windows") + "</span>" +
    '<span class="opw__tbsearch" title="Search">' + opIcon("search") + "<i>Search</i></span>" +
    '<span class="opw__tbapp" title="Task view">' + opIcon("taskview") + "</span>" +
    '<span class="opw__tbsep"></span>' +
    '<span class="opw__tbapp is-open" title="File Explorer">' + opIcon("explorer") + "</span>" +
    '<span class="opw__tbapp" title="Microsoft Edge">' + opIcon("edge") + "</span>" +
    '<span class="opw__tbapp is-active" title="Google Chrome">' + opIcon("chrome") + "</span>" +
    '<span class="opw__tbapp" title="Microsoft Outlook">' + opIcon("outlook") + "</span>" +
    '<span class="opw__tbapp" title="Microsoft Teams">' + opIcon("teams") + "</span>" +
  "</div>";
  return OP_TBMID;
}

function opTaskbar() {
  const clock = operatorClockParts();
  return '<div class="opw__taskbar">' + opTaskbarApps() +
    '<div class="opw__tray">' + opIcon("chevU") + opIcon("wifi") + opIcon("volume") + opIcon("battery") +
      '<span class="opw__clock"><time class="op-win-clock-time">' + esc(clock.time) + "</time>" +
      '<small class="op-win-clock-date">' + esc(clock.date) + "</small></span></div>" +
  "</div>";
}

/* --------------------------- bookmarks bar -------------------------
   What is actually pinned on a machine at this site. Ten bookmarks to ten
   pages of the same application is not what anyone's browser looks
   like, and it was the fastest way to give the session away.

   The system being driven is one bookmark. Everything else is the rest of the day:
   the portal customers see, the ERP, the standards the work is
   performed against, the quality system and the certificate register.

   Re-skinning: this is the one list in the Operator that is tenant-
   specific. Nothing else depends on it.
------------------------------------------------------------------- */
const OP_SITES = [
  { id: "fiori",   label: "SAP Fiori",           host: "fiori.{org}.com",         mark: "F", bg: "#0070f2" },
  { id: "control", label: "Mine Control",        host: "minecontrol.{org}.com",   mark: "M", bg: "#e0a11b" },
  { id: "ehs",     label: "SAP EHS",             host: "fiori.{org}.com",         mark: "E", bg: "#d20a0a" },
  { id: "gateway", label: "Contractor Gateway",  host: "gateway.{org}.com",       mark: "C", bg: "#f97316" },
  { id: "hub",     label: "Standards Hub",       host: "standards.{org}.com",     mark: "S", bg: "#c2662e" },
  { id: "icmm",    label: "ICMM",                host: "icmm.com",                mark: "I", bg: "#00693c" },
  { id: "geo",     label: "Geoscience Database", host: "geoscience.{org}.com",    mark: "G", bg: "#8b5cf6" },
  { id: "reg",     label: "Regulator portal",    host: "regulator.gov",           mark: "R", bg: "#1b4d89" },
  { id: "outlook", label: "Outlook",             host: "outlook.office.com", icon: "outlook" },
  { id: "teams",   label: "Teams",               host: "teams.microsoft.com", icon: "teams" },
];

/** Where a bookmark actually points. Shown on hover, the way a real
    browser does, so the estate reads as several systems on several
    hosts rather than one product with tabs. */
function opSiteHost(s) { return String(s.host).replace(/\{org\}/g, opTenantSlug()); }

function opSiteFav(s) {
  if (s.icon) return '<span class="opc__fav">' + opIcon(s.icon) + "</span>";
  return '<span class="opc__fav opc__fav--tile" style="background:' + s.bg + '">' + esc(s.mark) + "</span>";
}

/** The same site as a new-tab-page tile, which is a circle with the mark
    inside it rather than a bare favicon. */
function opSiteTile(s) {
  return "<i>" + (s.icon ? opIcon(s.icon)
    : '<em class="opg__tile" style="background:' + s.bg + '">' + esc(s.mark) + "</em>") + "</i>";
}

function opBookmarks() {
  return '<div class="opc__marks">' + OP_SITES.map(s =>
    '<span class="opc__mark" title="' + esc(opSiteHost(s)) + '">' +
    opSiteFav(s) + esc(s.label) + "</span>").join("") +
    '<span class="opc__mark opc__mark--more">' + opIcon("dots") + "</span></div>";
}

/* ------------------------ omnibox suggestions ---------------------- */
function opOmniDrop(task) {
  if (!task || !/^(address-focus|typing-url|press-enter)$/.test(task.phase)) return "";
  const typed = task.addressText || "";
  if (!typed) return "";
  const full = opHomeUrl(task.key);
  return '<div class="opc__drop">' +
    '<div class="is-sel">' + opFavicon(task.key) + "<b>" + esc(full) + "</b>" +
      "<small>" + esc(OP_DEPT[task.key].tabTitle) + "</small></div>" +
    "<div>" + opIcon("search") + "<span>" + esc(typed) + " — Google Search</span></div>" +
    "<div>" + opIcon("globe") + "<span>" + esc(full.split("/")[0]) + "</span>" +
      "<small>Visited today</small></div>" +
  "</div>";
}

/* ============================= the shell ============================ */
function operatorBrowserMarkup(rawOp) {
  const op = normalizeOperatorState(rawOp);
  const tab = opSelectedTab(op);
  /* The tab does not carry its department until the page has loaded, which
     is correct: a tab that is still typing an address is not on a site yet.
     But the run is still the thing being watched, so the surface has to be
     resolved from the run rather than from the tab. Reading it from the tab
     meant `task` was null for the whole of navigation, and the address bar
     showed its placeholder while the URL was being typed into a variable
     nobody rendered. */
  const live = opCurrentTask(op);
  const key = (tab && tab.key && OP_DEPT[tab.key]) ? tab.key
    : (live && live.status === "navigating" && OP_DEPT[live.key]) ? live.key : "";
  const task = key ? opTaskFor(op, key) : null;
  const view = key ? opViewFor(op, key) : "browser-start";
  const step = task && task.steps[task.index] ? task.steps[task.index].label : "";
  const navigating = task && task.status === "navigating";
  const showSite = key && (!navigating || task.phase === "app");

  const anchorMissing = (op.tasks || []).reduce((n, t) =>
    n + Object.keys(t.anchorAudit || {}).filter(k => t.anchorAudit[k] === "missing").length, 0);
  const anchorMissingLabels = (op.tasks || []).reduce((out, t) => out.concat(
    Object.keys(t.anchorAudit || {}).filter(k => t.anchorAudit[k] === "missing").map(k => t.key + ": " + k)
  ), []);

  const typing = task && /^(address-focus|typing-url|press-enter)$/.test(task.phase);
  const address = typing ? (task.addressText || "") : (tab && tab.url ? tab.url : "");
  const loading = task && task.phase === "loading";
  const surface = showSite ? opAppSurface(key, view, task) : opGoogleSurface(task);

  return '<div class="op-real-browser" data-platform="' + (key || "google") + '" data-view="' + view +
    '" data-anchor-misses="' + anchorMissing + '" data-anchor-missing-labels="' +
    esc(anchorMissingLabels.join(" | ")) + '">' +

    '<div class="opw"><div class="opw__wall"></div>' + opDesktopIcons() +
      '<div class="opw__win">' +

        '<div class="opc__tabs">' + opBrowserTabs(op) +
          '<div class="opc__caption"><button>' + opIcon("min") + "</button>" +
          "<button>" + opIcon("max") + "</button><button>" + opIcon("close") + "</button></div></div>" +

        '<div class="opc__bar">' +
          '<button class="opc__nav"' + (key ? "" : " disabled") + ">" + opIcon("back") + "</button>" +
          '<button class="opc__nav" disabled>' + opIcon("fwd") + "</button>" +
          '<button class="opc__nav">' + opIcon("reload") + "</button>" +
          '<div class="opc__omni' + (typing ? " is-focus" : "") + '">' +
            (typing ? opIcon("search") : address ? opIcon("lock") : opIcon("search")) +
            "<b>" + (address ? esc(address) : "<i>Search Google or type a URL</i>") +
            (typing ? '<span class="opc__caret"></span>' : "") + "</b>" +
            '<span class="opc__omniacts"><span>' + opIcon("star") + "</span></span>" +
          "</div>" +
          '<div class="opc__ext"><span>' + opIcon("puzzle") + "</span></div>" +
          '<span class="opc__avatar">' + esc(opUserInitials()) + "</span>" +
          '<div class="opc__ext"><span>' + opIcon("dots") + "</span></div>" +
        "</div>" +

        opBookmarks() +

        '<div class="op-real-viewport opc__page">' +
          '<div class="opc__scale">' + surface + "</div>" +
          (loading ? '<span class="opc__loadbar" style="width:62%"></span>' : "") +
          opOmniDrop(task) +
        "</div>" +

      "</div>" + opTaskbar() + "</div>" +

    '<div class="op-real-status"><span class="dot ' + (op.running ? "dot--pulse" : "") + '" data-tone="' +
      (op.finished ? "success" : op.paused ? "warn" : op.running ? "brand" : "") + '"></span><b>' +
      (op.paused ? "Paused" : op.running ? "Operator has control"
        : op.finished ? "Run completed" : "Chrome session ready") +
      "</b><span>" + esc(op.paused ? (step ? "Holding on: " + step : "Holding")
        : step || (op.finished ? "Every opened tab and completed action remains available"
        : "Chrome is waiting on a clean Google start page")) + "</span></div>" +
    '<div class="op-real-progress"><i style="width:' + op.progress + '%"></i></div></div>';
}

/* --------------------------- the timeline -------------------------- */
function opTimelineMarkup(op) {
  const selected = opSelectedTab(op);
  const task = selected && selected.key ? opTaskFor(op, selected.key) : opCurrentTask(op);
  if (!task) {
    return '<div class="op-real-idle"><b>Operator computer ready</b><span>The session starts on a clean Chrome tab. ' +
      "Ask Sara for the job and the Operator opens the org and works it through, one control at a time — " +
      "the same screens, in the same order, that the site uses.</span></div>";
  }
  const d = OP_DEPT[task.key];
  return '<div class="op-real-loghead"><b>' + esc(d.label) + "</b><span>" +
    (task.status === "done" ? "Complete"
      : task.status === "navigating" ? "Opening session"
      : (task.index + 1) + " / " + task.steps.length) + "</span></div>" +
    (task.status === "navigating"
      ? '<div class="op-real-navlog"><span class="op-real-navdot"></span><b>' +
        (task.phase === "typing-url" ? "Typing " + esc(task.addressText || "")
          : task.phase === "loading" ? "Waiting for " + opSystemName()
          : "Opening a new browser tab") + "</b></div>"
      : "") +
    '<div class="op-real-steps">' + task.steps.map((s, i) => {
      const st = task.status === "done" || i < task.index ? "done"
        : i === task.index && task.status === "running" ? "run" : "wait";
      return '<div class="op-real-step" data-state="' + st + '"><span>' +
        (st === "done" ? Icons.svg("check") : st === "run" ? Icons.svg("zap") : (i + 1)) +
        "</span><b>" + esc(s.label) + "</b><code>" +
        (st === "done" ? ((s.ms || 0) / 1000).toFixed(1) + "s" : st === "run" ? opActionKind(s).label : "") +
        "</code></div>";
    }).join("") + "</div>";
}

/* ============================ the pointer =========================== */
function fitOperatorStage(host) {
  const scope = host || document;
  scope.querySelectorAll(".opc__page").forEach(page => {
    const stage = page.querySelector(".opc__scale");
    if (!stage) return;
    const r = page.getBoundingClientRect();
    if (!r.width) return;
    const scale = Math.max(0.18, r.width / OP_STAGE_W);
    stage.style.setProperty("--op-scale", scale.toFixed(4));
    /* the window is sized from the page rather than the other way round,
       so an application screen is never cut off half way down */
    page.style.height = Math.round(OP_STAGE_H * scale) + "px";
  });
}

/* --------------------------------------------------------------------
   The pointer is deliberately NOT part of the repainted markup.

   A real machine's mouse pointer does not blink out of existence every
   time a page updates. Rebuilding it with the surface also restarted its
   press animation on every repaint, which is what made the operator look
   like it was clicking over and over in the same place. It lives above
   the browser window and is only ever moved; a click plays exactly once
   per action, by token.

   It is also drawn at a fixed size in screen pixels rather than inside
   the scaled page, because a real cursor does not scale with page zoom.
-------------------------------------------------------------------- */
let OP_CLICK_PLAYED = {};
let OP_CLICK_TIMER = null;
function opResetClicks() { OP_CLICK_PLAYED = {}; }

function opPointerLayer(host) {
  const panel = host && host.parentElement;
  if (!panel) return null;
  let layer = panel.querySelector(".opptr");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "opptr";
    layer.setAttribute("data-on", "0");
    layer.innerHTML = '<span class="opptr__ring"></span>' +
      '<span class="opptr__cur"></span><span class="opptr__say"></span>';
    panel.appendChild(layer);
  }
  return layer;
}

function opVisibleElement(el) {
  if (!el || !el.getBoundingClientRect) return false;
  const r = el.getBoundingClientRect();
  return r.width > 2 && r.height > 2;
}

/** Which control this step acts on. Anchors are held per step index so a
    reworded label can never point the cursor at the wrong control. */
function opStepAnchor(task) {
  const list = OP_ANCHOR[task.key];
  return (list && list[task.index]) || null;
}

function opFindAnchor(stage, task) {
  const anchor = opStepAnchor(task);
  if (!anchor) return null;
  let nodes = Array.from(stage.querySelectorAll(anchor[0])).filter(opVisibleElement);
  /* a fallback selector lets a step keep the pointer on what it produced
     once a transient control (a dialog, a dropdown) has closed */
  if (!nodes.length && anchor[2]) {
    nodes = Array.from(stage.querySelectorAll(anchor[2])).filter(opVisibleElement);
    if (nodes.length) return nodes[0];
  }
  if (!nodes.length) return null;
  if (!anchor[1]) return nodes[0];
  const want = String(anchor[1]).trim().toLowerCase();
  return nodes.find(el => String(el.innerText || el.textContent || "").trim().toLowerCase() === want) ||
    nodes.find(el => String(el.innerText || el.textContent || "").toLowerCase().indexOf(want) >= 0) ||
    nodes[0];
}

/** Scroll a target into view inside whichever pane actually scrolls. */
/* Scrolling a target into view is right once per step and wrong every
   time after that: the pointer is repositioned continuously, so doing it
   unconditionally means the moment a viewer scrolls to read something
   else the surface yanks itself back. Each step gets one reveal. */
let OP_REVEALED = {};
function opResetReveals() { OP_REVEALED = {}; }

function opRevealDomTarget(target, viewport, token) {
  if (token) {
    if (OP_REVEALED[token]) return;
    OP_REVEALED[token] = 1;
  }
  let scroller = target && target.parentElement;
  while (scroller && scroller !== viewport) {
    if (scroller.scrollHeight > scroller.clientHeight + 6) {
      const sr = scroller.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      const visible = Math.min(tr.bottom, sr.bottom) - Math.max(tr.top, sr.top);
      if (visible < Math.min(tr.height, 44)) {
        const pad = Math.max(14, (sr.height - Math.min(tr.height, sr.height)) / 2);
        scroller.scrollTop += (tr.top - sr.top) - pad;
      }
      break;
    }
    scroller = scroller.parentElement;
  }
}

/** One token per real click. */
function opClickToken(task, kind) {
  if (kind === "wait" || kind === "inspect") return "";
  return task.key + "#" + task.index;
}

function positionOperatorPointer(host) {
  if (!host || !host.isConnected) return;
  fitOperatorStage(host);
  const layer = opPointerLayer(host);
  const panel = host.parentElement;
  const stage = host.querySelector(".opc__scale");
  const page = host.querySelector(".opc__page");
  const root = host.querySelector(".op-real-browser");
  if (!layer || !panel || !stage || !page || !root) return;

  const key = root.dataset.platform || "";
  const op = normalizeOperatorState(OpState.get());
  const task = key && OP_DEPT[key] ? opTaskFor(op, key) : null;
  if (!task || task.status !== "running" || !op.running) { layer.setAttribute("data-on", "0"); return; }

  const step = task.steps[task.index] || {};
  const kind = opActionKind(step).type;
  const target = opFindAnchor(stage, task);
  if (!task.anchorAudit) task.anchorAudit = {};
  if (!target) { task.anchorAudit[step.label] = "missing"; layer.setAttribute("data-on", "0"); return; }
  opRevealDomTarget(target, stage, task.key + "#" + task.index);

  /* Only touch the attribute when it actually moves. Re-stamping it on
     every reposition restarted the highlight transition continuously,
     which is what made the marker flicker rather than sit still. */
  if (target.getAttribute("data-op-target") !== "true") {
    stage.querySelectorAll('[data-op-target="true"]').forEach(el => el.removeAttribute("data-op-target"));
    target.setAttribute("data-op-target", "true");
  }

  const pr = panel.getBoundingClientRect();
  const gr = page.getBoundingClientRect();
  const tr = target.getBoundingClientRect();
  /* aim at the middle of the part of the control that is actually on
     screen, so the cursor never points past the edge of the page */
  const l = Math.max(tr.left, gr.left), r = Math.min(tr.right, gr.right);
  const t = Math.max(tr.top, gr.top), b = Math.min(tr.bottom, gr.bottom);
  const visible = r - l > 2 && b - t > 2;
  const cx = (l + r) / 2, cy = (t + b) / 2;
  task.anchorAudit[step.label] = visible ? "anchored" : "missing";
  if (!visible) { layer.setAttribute("data-on", "0"); return; }

  const x = cx - pr.left, y = cy - pr.top;
  const was = layer.getAttribute("data-on") === "1";
  const px = Number(layer.dataset.x || 0), py = Number(layer.dataset.y || 0);
  const dist = was ? Math.hypot(x - px, y - py) : 0;
  const moveMs = was ? Math.max(260, Math.min(760, Math.round(220 + dist * 1.5))) : 0;

  /* once a field is clicked the hand stays put: a growing text box must
     not drag the mouse pointer around with it */
  const settled = kind === "type" && OP_CLICK_PLAYED[task.key + "#" + task.index] && was;

  if (!settled && (x !== px || y !== py || !was)) {
    layer.style.setProperty("--op-move-ms", moveMs + "ms");
    layer.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    layer.dataset.x = x;
    layer.dataset.y = y;
  }
  layer.setAttribute("data-on", "1");
  layer.setAttribute("data-cursor", kind === "type" && OP_CLICK_PLAYED[task.key + "#" + task.index]
    ? "beam" : kind === "wait" || kind === "inspect" ? "arrow" : "hand");

  const cur = layer.querySelector(".opptr__cur");
  const glyph = layer.getAttribute("data-cursor");
  if (cur && cur.dataset.glyph !== glyph) {
    cur.innerHTML = OP_CURSOR[glyph] || OP_CURSOR.arrow;
    cur.dataset.glyph = glyph;
  }

  /* caption: sits with the cursor and flips rather than drifting away */
  const say = layer.querySelector(".opptr__say");
  if (say) {
    if (say.textContent !== step.label) say.textContent = step.label || "";
    const room = gr.right - cx;
    say.setAttribute("data-side", room < 230 ? "left" : "right");
    say.setAttribute("data-up", cy > gr.bottom - 54 ? "1" : "0");
  }

  /* the click itself: once, after the cursor has arrived */
  const token = opClickToken(task, kind);
  if (token && !OP_CLICK_PLAYED[token]) {
    OP_CLICK_PLAYED[token] = 1;
    if (OP_CLICK_TIMER) clearTimeout(OP_CLICK_TIMER);
    OP_CLICK_TIMER = setTimeout(() => {
      if (!layer.isConnected || layer.getAttribute("data-on") !== "1") return;
      layer.classList.remove("is-click");
      void layer.offsetWidth;
      layer.classList.add("is-click");
      setTimeout(() => layer.classList.remove("is-click"), 620);
    }, moveMs + 90);
  }
}

function scheduleOperatorPointer(host) {
  if (!host) return;
  scheduleOperatorClock(host);
  fitOperatorStage(host);
  requestAnimationFrame(() => positionOperatorPointer(host));
  /* rAF is parked while the tab is hidden, so the pointer would otherwise
     still be on the previous control when the viewer comes back to it */
  setTimeout(() => positionOperatorPointer(host), 90);
}

/* ------------------------------------------------------------------
   Pacing.

   This is presentation software, not a benchmark. The constraint is a
   person in a room following what the machine is doing, so every step
   has to survive being watched: the caption has to be readable, the
   cursor has to visibly travel, the click has to land, and the screen
   has to hold long enough for the change to register.

   Roughly, at Normal: a click is 2.8s, typing 5.0s, a processing step
   3.6s and a read 3.4s. A twelve-step journey runs about three quarters
   of a minute including the browser navigation, which is the length a
   room will actually sit through.

   Slow and Fast are there because a presenter who has told this story
   ten times wants Fast, and a first-time viewer wants Slow.
------------------------------------------------------------------ */
const OP_TICK_MS = 100;
const OP_STEP_TICKS = { click: 28, type: 50, wait: 36, inspect: 34, key: 20 };

/* how many ticks each navigation phase holds */
const OP_NAV_TICKS = { newtab: 14, "address-focus": 10, "press-enter": 8, loading: 22 };

const OP_SPEEDS = [
  { key: "slow",   label: "Slow",   rate: 1.7 },
  { key: "normal", label: "Normal", rate: 1.0 },
  { key: "fast",   label: "Fast",   rate: 0.55 },
];
let OP_RATE_KEY = "normal";
function opRate() {
  const s = OP_SPEEDS.find(x => x.key === OP_RATE_KEY);
  return s ? s.rate : 1;
}
function opHold(base) { return Math.max(2, Math.round(base * opRate())); }

/* ==================================================================
   OpState — the run, and the machine that advances it
   ================================================================== */
const OpState = (function () {
  let op = normalizeOperatorState(null);
  let timer = null;
  let onChange = null;

  function get() { return op; }
  function set(fn) { fn(op); if (onChange) onChange(op); }
  function bind(cb) { onChange = cb; }

  /** Build a task from a department definition. Step 4 of the tuple is
      the parameter the step needs before it can be performed. */
  function taskFor(key) {
    const d = OP_DEPT[key];
    return {
      key: key,
      status: "navigating",
      phase: "newtab",
      index: 0,
      addressText: "",
      tick: 0,
      anchorAudit: {},
      steps: d.steps.map(s => ({ label: s[0], view: s[1], act: s[2] || "", needs: s[3] || "", ms: 0 })),
    };
  }

  /* ---------------------------------------------------------------
     the conversation, and asking rather than guessing
  --------------------------------------------------------------- */
  function say(who, text, note) {
    op.chat = (op.chat || []).concat([{ who: who, text: text, note: note || "" }]);
  }

  /** The field spec a department declares for one parameter. */
  function fieldSpec(key, id) {
    const list = (OP_DEPT[key] && OP_DEPT[key].fields) || [];
    return list.find(f => f.id === id) || null;
  }

  /** Everything the run still does not know that it is going to need. */
  function missingFor(task) {
    const d = OP_DEPT[task.key];
    return ((d && d.fields) || []).filter(f => f.required && !op.params[f.id]);
  }

  /** Stop and ask. The run holds exactly where it is; answering resumes
      it from the same step, with the answer in hand. */
  function askFor(spec) {
    Analytics.track("operator", { id: (opCurrentTask(op) || {}).key || "", ev: "ask", field: spec.id });
    op.ask = {
      id: spec.id,
      label: spec.label,
      placeholder: spec.ask || ("What should " + spec.label.toLowerCase() + " be?"),
      options: spec.options || null,
    };
    op.paused = true;
    op.awaiting = true;
    if (timer) { clearInterval(timer); timer = null; }
    say("op", spec.ask || ("I need " + spec.label.toLowerCase() + " before I can carry on."),
        spec.why || "");
    if (onChange) onChange(op);
  }

  /** An answer from the chat. Either it fills the question that is open,
      or it is a correction to something already captured. */
  function reply(text) {
    say("you", text);
    if (op.ask) {
      const id = op.ask.id;
      const spec = fieldSpec(op.tasks[0] ? op.tasks[0].key : "", id);
      op.params[id] = normaliseParam(spec, text);
      op.paramsRev = (op.paramsRev || 0) + 1;
      op.ask = null;
      op.awaiting = false;
      say("op", "Thank you. " + (spec ? spec.label : "Noted") + ": " + op.params[id] +
          ". Carrying on.");
      if (onChange) onChange(op);
      /* a beat so the answer is readable before the screen starts moving */
      setTimeout(function () { if (!op.ask && !op.control) resume(); }, 700);
      return;
    }
    /* volunteered mid-run: take it as a correction to whichever field it
       plausibly belongs to, and say what was changed rather than silently
       absorbing it */
    const task = op.tasks[0];
    const guess = task ? guessField(task.key, text) : null;
    if (guess) {
      op.params[guess.id] = normaliseParam(guess, text);
      op.paramsRev = (op.paramsRev || 0) + 1;
      say("op", "Updated " + guess.label.toLowerCase() + " to: " + op.params[guess.id] + ".");
    } else {
      say("op", "Noted. I will keep going; use Take control if you need to change something on the screen yourself.");
    }
    if (onChange) onChange(op);
  }

  function normaliseParam(spec, text) {
    const v = String(text || "").trim();
    if (!spec) return v;
    if (spec.kind === "money") {
      const m = v.match(/[\d,]+(?:\.\d+)?/);
      return m ? "$" + m[0].replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") : v;
    }
    if (spec.kind === "number") {
      const m = v.match(/[\d,]+/);
      return m ? m[0].replace(/,/g, "") : v;
    }
    return v;
  }

  /** Which field a volunteered message is most likely about. */
  function guessField(key, text) {
    const t = String(text || "").toLowerCase();
    const list = (OP_DEPT[key] && OP_DEPT[key].fields) || [];
    let best = null, bestScore = 0;
    list.forEach(f => {
      let s = 0;
      (f.hints || []).forEach(h => { if (t.indexOf(String(h).toLowerCase()) !== -1) s += 2; });
      if (t.indexOf(f.label.toLowerCase()) !== -1) s += 3;
      if (s > bestScore) { bestScore = s; best = f; }
    });
    return bestScore >= 2 ? best : null;
  }

  /* ---------------------------------------------------------------
     take control
  --------------------------------------------------------------- */
  function toggleControl() {
    Analytics.track("operator", { id: (opCurrentTask(op) || {}).key || "",
                                  ev: op.control ? "control-end" : "control" });
    if (op.control) {
      op.control = false;
      say("op", "Thanks, I have it from here.");
      if (onChange) onChange(op);
      if (!op.ask && !op.finished) setTimeout(function () { resume(); }, 400);
      return;
    }
    op.control = true;
    if (timer) { clearInterval(timer); timer = null; }
    op.paused = true;
    say("op", "You have the screen. Edit any highlighted field or pick a different row, then give control back and I will carry on from here.");
    if (onChange) onChange(op);
  }

  /** A field the user edited while they had control. */
  function setParam(id, value, opts) {
    if (!id) return;
    const spec = op.tasks[0] ? fieldSpec(op.tasks[0].key, id) : null;
    op.params[id] = spec ? normaliseParam(spec, value) : value;
    op.paramsRev = (op.paramsRev || 0) + 1;
    /* A value the person supplied by picking something has to be
       acknowledged as visibly as one they typed. Silently absorbing a
       click is what made selecting an option look like it did nothing,
       while typing into the same screen clearly worked. */
    if (opts && opts.announce) {
      say("op", (spec ? spec.label : id) + " set to: " + op.params[id] + ".",
          opts.note || "from your selection on the screen");
      if (onChange) onChange(op);
    }
  }

  function reset() {
    stop();
    op = normalizeOperatorState(null);
    opResetClicks();
    opResetReveals();
    if (onChange) onChange(op);
  }

  /** Start a run. `params` is whatever the request already told us; the
      run asks about anything else it needs when it reaches the step that
      needs it, rather than up front or, worse, by guessing. */
  function start(key, params) {
    if (!OP_DEPT[key]) return;
    stop();
    opResetClicks();
    opResetReveals();
    op.tasks = [taskFor(key)];
    op.tabs = [opBlankTab("tab-0")];
    op.preview = "tab-0";
    op.params = Object.assign({}, params || {});
    op.paramsRev = 0;
    op.chat = [];
    op.ask = null;
    op.control = false;
    op.paused = false;
    op.running = true;
    op.finished = false;
    op.progress = 0;

    const d = OP_DEPT[key];
    const known = Object.keys(op.params).filter(k => op.params[k]);
    Analytics.track("operator", { id: key, ev: "start",
      n: Object.keys((op.params) || {}).length,
      title: d.runTitle, inputs: op.params || {} });
    say("op", "Starting: " + d.runTitle + ".",
        known.length ? "Working from what you told me: " +
          known.map(k => {
            const f = fieldSpec(key, k);
            return (f ? f.label : k) + " " + op.params[k];
          }).join(" · ")
        : "You have not given me any detail yet, so I will ask as I go.");

    timer = setInterval(tick, OP_TICK_MS);
    if (onChange) onChange(op);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    op.running = false;
    op.paused = false;
  }

  /** Hold position without ending the run. A presenter stopping on a
      screen to talk about it is the single most common thing that happens
      during this demo, and restarting the whole journey to get back to it
      is the wrong answer. */
  function pause() {
    if (!timer) return;
    clearInterval(timer); timer = null;
    op.paused = true;
    if (onChange) onChange(op);
  }

  function resume() {
    if (timer || !op.paused) return;
    /* a question that has not been answered, or a screen the user still
       holds, are both reasons the run must stay where it is. Resuming
       past an open question would step straight through the gate that
       raised it and fill the field with nothing. */
    if (op.ask || op.control) return;
    op.paused = false;
    op.running = true;
    op.awaiting = false;
    timer = setInterval(tick, OP_TICK_MS);
    if (onChange) onChange(op);
  }

  function togglePause() { op.paused ? resume() : pause(); }

  /** Change speed mid-run without losing position. */
  function setSpeed(key) {
    if (!OP_SPEEDS.some(s => s.key === key)) return;
    OP_RATE_KEY = key;
    if (onChange) onChange(op);
  }
  function speed() { return OP_RATE_KEY; }

  function tick() {
    const task = op.tasks[0];
    if (!task) { stop(); return; }
    task.tick++;

    if (task.status === "navigating") {
      const url = opHomeUrl(task.key);
      const tab = op.tabs[0];

      if (task.phase === "newtab") {
        tab.title = "New Tab"; tab.url = ""; tab.key = "";
        if (task.tick >= opHold(OP_NAV_TICKS.newtab)) { task.phase = "address-focus"; task.tick = 0; }
      } else if (task.phase === "address-focus") {
        if (task.tick >= opHold(OP_NAV_TICKS["address-focus"])) { task.phase = "typing-url"; task.tick = 0; }
      } else if (task.phase === "typing-url") {
        /* Typed in uneven bursts, the way a person types a familiar
           address: a run of characters, a fractional pause, another run.
           A constant rate reads as a progress bar rather than as typing. */
        const burst = [2, 1, 3, 1, 2][task.tick % 5];
        const n = Math.min(url.length, task.addressText.length + Math.max(1, Math.round(burst / opRate())));
        task.addressText = url.slice(0, n);
        if (n >= url.length) { task.phase = "press-enter"; task.tick = 0; }
      } else if (task.phase === "press-enter") {
        tab.status = "navigating"; tab.title = "Loading…";
        if (task.tick >= opHold(OP_NAV_TICKS["press-enter"])) { task.phase = "loading"; task.tick = 0; }
      } else if (task.phase === "loading") {
        if (task.tick >= opHold(OP_NAV_TICKS.loading)) {
          task.phase = "app";
          task.status = "running";
          task.index = 0;
          task.tick = 0;
          tab.status = "idle";
          tab.key = task.key;
          tab.title = OP_DEPT[task.key].tabTitle;
          tab.url = opUrlFor(task.key, task.steps[0].view);
        }
      }
      recompute();
      if (onChange) onChange(op);
      return;
    }

    if (task.status === "running") {
      const step = task.steps[task.index];

      /* Before performing a step that writes a value, make sure the value
         came from the person rather than from this file. If it did not,
         stop and ask. This is the whole point: a run that invents a
         customer's authorisation limit is worse than one that pauses. */
      if (step.needs && !op.ask && !op.control) {
        const want = String(step.needs).split(",").map(s => s.trim()).filter(Boolean);
        const gap = want.find(id => !op.params[id]);
        if (gap) {
          const spec = fieldSpec(task.key, gap);
          if (spec) { askFor(spec); return; }
        }
      }

      const hold = opHold(OP_STEP_TICKS[opActionKind(step).type] || 26);
      if (task.tick >= hold) {
        step.ms = task.tick * OP_TICK_MS;
        task.index++;
        task.tick = 0;
        if (task.index >= task.steps.length) {
          task.index = task.steps.length - 1;
          task.status = "done";
          op.running = false;
          op.finished = true;
          stop();
          try{
            Analytics.track("operator", {
              id: task.key, ev: "done", n: task.steps.length,
              title: OP_DEPT[task.key].runTitle,
              inputs: op.params || {},
              output: task.steps.map(function (s, i) {
                return (i + 1) + ". " + s.label;
              }).join("\n"),
            });
          }catch(e){ /* recording must never break a run */ }
          say("op", "Done. " + OP_DEPT[task.key].runTitle + " is complete and every step is logged above.");
        }
        const cur = task.steps[Math.min(task.index, task.steps.length - 1)];
        op.tabs[0].url = opUrlFor(task.key, task.status === "done" ? "verify" : cur.view);
      }
      recompute();
      if (onChange) onChange(op);
    }
  }

  function recompute() {
    const task = op.tasks[0];
    if (!task) { op.progress = 0; return; }
    const total = task.steps.length + 1;          /* +1 for the navigation */
    const done = task.status === "done" ? total
      : task.status === "running" ? task.index + 1
      : Math.min(0.9, task.tick / 20);
    op.progress = Math.round(Math.min(100, (done / total) * 100));
  }

  return {
    get: get, set: set, bind: bind, start: start, stop: stop, reset: reset,
    pause: pause, resume: resume, togglePause: togglePause,
    setSpeed: setSpeed, speed: speed,
    reply: reply, toggleControl: toggleControl, setParam: setParam,
    missingFor: missingFor, fieldSpec: fieldSpec, say: say,
  };
})();

/* ==================================================================
   Operator — the overlay, and the only thing the rest of SARA calls
   ------------------------------------------------------------------
   Mounts its own DOM so nothing in 50-body.html has to know it exists
   beyond the one button that opens it.

   RENDERING. The stage is NOT rebuilt on every tick. It used to be, ten
   times a second, and that single decision caused three separate faults
   that all looked like different bugs: the screen could not be scrolled
   because every scroll position was thrown away sixteen milliseconds
   later; the marker on the control being clicked flickered because the
   element carrying it was destroyed and recreated continuously; and the
   click animation appeared to fire over and over because its element
   kept being replaced mid-animation.

   So the stage is rebuilt only when the screen actually changes. Between
   those points the run still moves — text types itself, the address bar
   fills, the progress bar advances — and all of that is written into the
   existing DOM in place. `stageKey()` is the line between the two.
   ================================================================== */
const Operator = (function () {
  let root = null;
  let stageHost = null;
  let side = null;
  let stepsHost = null;
  let chatHost = null;
  let current = "";
  let lastKey = "";
  let lastView = "";
  let lastChatLen = -1;

  /* Which half of the side pane is showing. It switches itself when the
     run needs something and switches back when it does not, because a
     question nobody can see is the same as no question at all. A manual
     click wins until the next time the run's own state changes. */
  let sideTab = "steps";
  let lastAsking = false;
  let unread = 0;

  function mount() {
    if (root) return root;
    root = document.createElement("div");
    root.className = "opov";
    root.id = "operator";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", opSystemName() + " Operator");
    root.innerHTML =
      '<div class="opov__head">' +
        '<span class="opov__mark">' + Icons.svg("monitor") + "</span>" +
        '<span class="opov__title"><b>Operator — ' + esc(opSystemName()) + "</b>" +
          '<span id="opSubtitle">' + esc(opOrgHost("")) + " · Chrome session</span></span>" +
        '<span class="opov__spacer"></span>' +
        '<div class="opov__speed" id="opSpeed"></div>' +
        '<button class="btn btn-sm" id="opControl">' + Icons.el("grip") + "Take control</button>" +
        '<button class="ib tip tip-b" data-tip="Pause" id="opPause" aria-label="Pause">' +
          '<span class="i" data-icon="stop"></span></button>' +
        '<button class="ib tip tip-b" data-tip="Restart" id="opReset" aria-label="Restart">' +
          '<span class="i" data-icon="refresh"></span></button>' +
        '<button class="ib tip tip-b" data-tip="Close" id="opClose" aria-label="Close">' +
          '<span class="i" data-icon="close"></span></button>' +
      "</div>" +
      '<div class="opov__body">' +
        '<div class="opov__stage"><div id="opStage"></div></div>' +
        '<aside class="opov__side">' +
          '<div class="opov__tabs" id="opTabs">' +
            '<button class="opov__tab" data-optab="steps" aria-selected="true">' +
              Icons.svg("checklist") + "Steps<em id=\"opTabSteps\"></em></button>" +
            '<button class="opov__tab" data-optab="chat" aria-selected="false">' +
              Icons.svg("chat") + "Chat<em id=\"opTabChat\"></em></button>" +
          "</div>" +
          '<div class="opov__panes">' +
            '<div class="opov__steps" id="opSteps"></div>' +
            '<div class="opov__chat" id="opChat"></div>' +
          "</div>" +
        "</aside>" +
      "</div>";
    document.body.appendChild(root);

    stageHost = root.querySelector("#opStage");
    side = root.querySelector(".opov__side");
    stepsHost = root.querySelector("#opSteps");
    chatHost = root.querySelector("#opChat");

    root.querySelector("#opClose").addEventListener("click", close);
    root.querySelector("#opReset").addEventListener("click", () => {
      OpState.reset();
      current = "";
      lastKey = ""; lastView = ""; lastChatLen = -1;
      sideTab = "steps"; lastAsking = false; unread = 0;
      render(true);
    });
    root.querySelector("#opSpeed").addEventListener("click", e => {
      const btn = e.target.closest("[data-speed]");
      if (btn) OpState.setSpeed(btn.getAttribute("data-speed"));
    });
    root.querySelector("#opPause").addEventListener("click", () => OpState.togglePause());
    root.querySelector("#opControl").addEventListener("click", () => OpState.toggleControl());
    root.querySelector("#opTabs").addEventListener("click", e => {
      const b = e.target.closest("[data-optab]");
      if (b) showTab(b.getAttribute("data-optab"), true);
    });

    /* the chat: answering a question the Operator asked, or just talking
       to it while it works */
    chatHost.addEventListener("click", e => {
      const send = e.target.closest("#opSend");
      if (send) { submitChat(); return; }
      const chip = e.target.closest("[data-op-suggest]");
      if (chip) {
        const inp = root.querySelector("#opChatIn");
        if (inp) { inp.value = chip.getAttribute("data-op-suggest"); submitChat(); }
      }
    });
    chatHost.addEventListener("keydown", e => {
      if (e.target && e.target.id === "opChatIn" && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); submitChat();
      }
      /* the chat has a text box in it, so space must reach it */
      e.stopPropagation();
    });

    /* while the user has control, their edits on the screen are real */
    stageHost.addEventListener("input", e => {
      if (!OpState.get().control) return;
      const f = e.target.closest("[data-op-field]");
      if (f) OpState.setParam(f.getAttribute("data-op-field"), f.innerText.trim());
    });
    stageHost.addEventListener("click", e => {
      if (!OpState.get().control) return;

      /* Any data grid, whichever design system drew it. This was bound to
         one product's grid class, so in every other build a click on a row
         did nothing while typing into the same screen worked — which is
         exactly how a selection came to look like it was ignored. A
         `tbody tr` inside the operator stage is always a data grid. */
      const row = e.target.closest("tbody tr");
      if (row && row.parentElement) {
        Array.from(row.parentElement.children).forEach(r => r.classList.remove("is-sel"));
        row.classList.add("is-sel");
        opAnnouncePick(row);
        return;
      }

      /* Option-shaped controls on the screen: a segmented control, a tab
         strip, a chip. Same rule — picking one is an answer. */
      const opt = e.target.closest("[data-op-pick]");
      if (opt) {
        const group = opt.getAttribute("data-op-pick");
        stageHost.querySelectorAll('[data-op-pick="' + group + '"]')
          .forEach(n => n.classList.remove("is-sel"));
        opt.classList.add("is-sel");
        opAnnouncePick(opt);
      }
    });

    document.addEventListener("keydown", e => {
      if (!root.classList.contains("is-open")) return;
      const inField = e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" ||
        e.target.isContentEditable);
      if (e.key === "Escape") { close(); return; }
      /* space is what everyone reaches for to pause something that is
         playing, but not while they are typing into something */
      if (!inField && (e.key === " " || e.code === "Space")) { e.preventDefault(); OpState.togglePause(); }
    });

    Icons.hydrate(root);
    /* Deliberately not `bind(render)`: the state machine calls its listener
       with the state object, which would land in render's `force` argument
       and make every single tick a full rebuild. That is precisely the bug
       the diffing above exists to avoid. */
    OpState.bind(function () { render(); });
    return root;
  }

  /** Show a half of the side pane. `byUser` only affects the unread count:
      landing on the chat because you clicked it still counts as read. */
  function showTab(tab, byUser) {
    if (tab !== "steps" && tab !== "chat") return;
    sideTab = tab;
    if (tab === "chat") unread = 0;
    if (!root) return;
    root.querySelectorAll("[data-optab]").forEach(b =>
      b.setAttribute("aria-selected", String(b.getAttribute("data-optab") === tab)));
    root.querySelector("#opSteps").classList.toggle("is-on", tab === "steps");
    root.querySelector("#opChat").classList.toggle("is-on", tab === "chat");
    if (tab === "chat") {
      const log = root.querySelector("#opChatLog");
      if (log) log.scrollTop = log.scrollHeight;
      const inp = root.querySelector("#opChatIn");
      if (inp && byUser) setTimeout(() => inp.focus(), 30);
    }
  }

  /** The pane follows the run: to the chat the moment it needs an answer
      or hands over the screen, and back to the steps once it is working
      again. */
  function autoTab(op) {
    const asking = !!op.ask || !!op.control;
    if (asking && !lastAsking) showTab("chat");
    else if (!asking && lastAsking) showTab("steps");
    lastAsking = asking;
  }

  function speedPicker() {
    return OP_SPEEDS.map(s =>
      '<button class="opov__speedbtn" data-speed="' + s.key + '" aria-pressed="' +
      (OpState.speed() === s.key) + '">' + esc(s.label) + "</button>").join("");
  }

  /* ---------------------------------------------------------------
     the line between rebuilding and updating in place
  --------------------------------------------------------------- */
  function stageKey(op) {
    const tab = opSelectedTab(op);
    const live = opCurrentTask(op);
    const key = (tab && tab.key && OP_DEPT[tab.key]) ? tab.key
      : (live && live.status === "navigating" && OP_DEPT[live.key]) ? live.key : "";
    const task = key ? opTaskFor(op, key) : null;
    const view = key ? opViewFor(op, key) : "browser-start";
    return [
      key, view,
      task ? task.phase : "",
      task ? task.status : "",
      task ? task.index : -1,
      op.paused ? 1 : 0, op.running ? 1 : 0, op.finished ? 1 : 0, op.control ? 1 : 0,
      op.paramsRev || 0,
    ].join("|");
  }

  function currentView(op) {
    const tab = opSelectedTab(op);
    const live = opCurrentTask(op);
    const key = (tab && tab.key && OP_DEPT[tab.key]) ? tab.key
      : (live && live.status === "navigating" && OP_DEPT[live.key]) ? live.key : "";
    return key ? opViewFor(op, key) : "browser-start";
  }

  /** Scroll positions of everything inside the stage that scrolls. */
  function grabScroll() {
    const out = [];
    stageHost.querySelectorAll(".sf-main, .sf-grid__wrap, .sf-modal__b, .sf-gantt")
      .forEach((n, i) => { if (n.scrollTop) out.push([i, n.scrollTop]); });
    return out;
  }
  function putScroll(list) {
    if (!list.length) return;
    const nodes = stageHost.querySelectorAll(".sf-main, .sf-grid__wrap, .sf-modal__b, .sf-gantt");
    list.forEach(([i, top]) => { if (nodes[i]) nodes[i].scrollTop = top; });
  }

  /** Everything that moves within a step, written into the existing DOM. */
  function liveUpdate(op) {
    const tab = opSelectedTab(op);
    const live = opCurrentTask(op);
    const key = (tab && tab.key && OP_DEPT[tab.key]) ? tab.key
      : (live && live.status === "navigating" && OP_DEPT[live.key]) ? live.key : "";
    const task = key ? opTaskFor(op, key) : null;

    /* the address bar while the URL is being typed */
    if (task && /^(address-focus|typing-url|press-enter)$/.test(task.phase)) {
      const b = stageHost.querySelector(".opc__omni b");
      if (b) {
        const txt = task.addressText || "";
        b.innerHTML = (txt ? esc(txt) : "<i>Search Google or type a URL</i>") +
          '<span class="opc__caret"></span>';
      }
      const drop = stageHost.querySelector(".opc__drop b");
      if (drop && !drop.textContent) drop.textContent = opHomeUrl(task.key);
    }

    /* fields that type themselves */
    if (task && task.status === "running") {
      (opLiveText(key, currentView(op), task) || []).forEach(f => {
        const n = stageHost.querySelector("#" + f.id);
        if (!n) return;
        const want = f.text + (f.caret ? "​" : "");
        if (n.dataset.opText === want) return;
        n.dataset.opText = want;
        n.innerHTML = (f.text ? esc(f.text) : (f.placeholder ? esc(f.placeholder) : "&nbsp;")) +
          (f.caret ? '<span class="op-caret"></span>' : "");
        n.classList.toggle("is-empty", !f.text && !!f.placeholder);
      });
    }

    /* the progress bar and the status line */
    const bar = stageHost.querySelector(".op-real-progress i");
    if (bar) bar.style.width = op.progress + "%";
  }

  /* ---------------------------------------------------------------
     render
  --------------------------------------------------------------- */
  function render(force) {
    if (!root) return;
    const op = OpState.get();

    const sp = root.querySelector("#opSpeed");
    if (sp && sp.dataset.rate !== OpState.speed()) {
      sp.innerHTML = speedPicker();
      sp.dataset.rate = OpState.speed();
    }

    const pb = root.querySelector("#opPause");
    if (pb) {
      const alive = op.running || op.paused;
      pb.disabled = !alive;
      const icon = op.paused ? "arrowright" : "stop";
      if (pb.dataset.glyph !== icon) {
        pb.innerHTML = '<span class="i">' + Icons.svg(icon) + "</span>";
        pb.dataset.glyph = icon;
        pb.setAttribute("data-tip", op.paused ? "Resume" : "Pause");
        pb.setAttribute("aria-label", op.paused ? "Resume" : "Pause");
      }
      pb.classList.toggle("on", !!op.paused);
    }

    const cb = root.querySelector("#opControl");
    if (cb) {
      const on = !!op.control;
      if (cb.dataset.on !== String(on)) {
        cb.dataset.on = String(on);
        cb.innerHTML = Icons.el(on ? "check" : "grip") + (on ? "Give control back" : "Take control");
        cb.classList.toggle("btn-primary", on);
      }
      cb.disabled = !(op.running || op.paused || op.finished);
    }

    root.classList.toggle("is-control", !!op.control);

    const k = stageKey(op);
    const view = currentView(op);
    if (force || k !== lastKey) {
      const keep = view === lastView ? grabScroll() : [];
      stageHost.innerHTML = operatorBrowserMarkup(op);
      putScroll(keep);
      /* while the user holds the screen, the fields the run writes into
         are genuinely theirs to edit */
      stageHost.querySelectorAll("[data-op-field]").forEach(n => {
        if (op.control) n.setAttribute("contenteditable", "true");
        else n.removeAttribute("contenteditable");
      });
      lastKey = k;
      lastView = view;
    } else {
      liveUpdate(op);
    }

    renderSteps(op);
    renderChat(op);
    autoTab(op);
    renderTabs(op);
    scheduleOperatorPointer(stageHost);
  }

  /** Counts on the tabs: how far through, and anything unread. */
  function renderTabs(op) {
    const task = op.tasks && op.tasks[0];
    const s = root.querySelector("#opTabSteps");
    if (s) {
      const txt = task ? (Math.min(task.index + 1, task.steps.length) + "/" + task.steps.length) : "";
      if (s.textContent !== txt) s.textContent = txt;
    }
    const c = root.querySelector("#opTabChat");
    if (c) {
      const txt = op.ask ? "!" : unread ? String(unread) : "";
      if (c.textContent !== txt) c.textContent = txt;
      c.className = op.ask ? "is-ask" : unread ? "is-unread" : "";
    }
  }

  /* the step list only changes when a step does */
  function renderSteps(op) {
    const sig = stageKey(op);
    if (stepsHost.dataset.sig === sig) return;
    stepsHost.dataset.sig = sig;
    stepsHost.innerHTML = opTimelineMarkup(op);
    Icons.hydrate(stepsHost);
  }

  /* ---------------------------------------------------------------
     the conversation
  --------------------------------------------------------------- */
  function renderChat(op) {
    const log = op.chat || [];
    const ask = op.ask || null;
    const sig = log.length + "|" + (ask ? ask.id : "") + "|" + (op.control ? 1 : 0);
    if (chatHost.dataset.sig === sig) return;
    /* something new arrived while the steps were showing */
    if (lastChatLen >= 0 && log.length > lastChatLen && sideTab !== "chat") {
      unread += log.length - lastChatLen;
    }
    lastChatLen = log.length;
    chatHost.dataset.sig = sig;

    const rows = log.map(m =>
      '<div class="opch__m" data-who="' + m.who + '">' +
        (m.who === "op" ? '<span class="opch__ic">' + Icons.svg("monitor") + "</span>" : "") +
        "<div>" + esc(m.text) +
          (m.note ? '<span class="opch__note">' + esc(m.note) + "</span>" : "") +
        "</div></div>").join("");

    const chips = ask && ask.options && ask.options.length
      ? '<div class="opch__chips">' + ask.options.map(o =>
          '<button class="opch__chip" data-op-suggest="' + esc(o) + '">' + esc(o) + "</button>").join("") + "</div>"
      : "";

    chatHost.innerHTML =
      '<div class="opch__h">' + Icons.svg("chat") + "<b>Operator</b>" +
        (ask ? '<span class="opch__wait">waiting on you</span>' : "") + "</div>" +
      '<div class="opch__log" id="opChatLog">' +
        (rows || '<div class="opch__empty">The Operator will ask here if it needs anything it was not told. ' +
          "You can also type at any point: it pauses, takes the answer and carries on.</div>") +
        chips +
      "</div>" +
      '<div class="opch__in">' +
        '<textarea id="opChatIn" rows="1" placeholder="' +
          esc(ask ? (ask.placeholder || "Type your answer…") : "Message the Operator…") + '"></textarea>' +
        '<button class="ib" id="opSend" aria-label="Send">' + Icons.svg("arrowup") + "</button>" +
      "</div>";

    const logEl = chatHost.querySelector("#opChatLog");
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
    chatHost.classList.toggle("is-on", sideTab === "chat");
    if (ask) {
      const inp = chatHost.querySelector("#opChatIn");
      if (inp) setTimeout(() => inp.focus(), 40);
    }
  }

  /** What a click on a row or an option actually means.

      A screen says which field a row stands for with `data-op-pick`, and
      optionally what value it carries with `data-op-value`. Where it says
      neither, the click is still acknowledged, because a selection that
      produces no visible response reads as a broken control. */
  function opAnnouncePick(node) {
    const field = node.getAttribute("data-op-pick");
    let value = node.getAttribute("data-op-value");
    if (!value) {
      /* fall back to the row's first meaningful cell, skipping a checkbox
         or selection gutter, which carries no text of its own */
      const cells = node.cells ? Array.from(node.cells) : [];
      const cell = cells.find(c => c.innerText && c.innerText.trim().length > 1);
      value = cell ? cell.innerText.trim() : String(node.innerText || "").trim();
    }
    value = value.replace(/\s+/g, " ").slice(0, 120);
    if (!value) return;
    if (field) OpState.setParam(field, value, { announce: true });
    else OpState.say("op", "Selected: " + value + ".", "from your selection on the screen");
  }

  function submitChat() {
    const inp = root.querySelector("#opChatIn");
    if (!inp) return;
    const text = inp.value.trim();
    if (!text) return;
    inp.value = "";
    OpState.reply(text);
  }

  /* ---------------------------------------------------------------
     open, close, run
  --------------------------------------------------------------- */
  function open(dept, params) {
    mount();
    root.classList.add("is-open");
    document.body.classList.add("op-open");
    lastKey = ""; lastView = ""; lastChatLen = -1;
    sideTab = "steps"; lastAsking = false; unread = 0;
    render(true);
    showTab("steps");
    if (dept) run(dept, params);
    else requestAnimationFrame(() => scheduleOperatorPointer(stageHost));
  }

  function close() {
    if (!root) return;
    OpState.stop();
    root.classList.remove("is-open");
    document.body.classList.remove("op-open");
  }

  function run(key, params) {
    if (!OP_DEPT[key]) return;
    mount();
    current = key;
    lastKey = ""; lastView = "";
    OpState.start(key, params);
  }

  function isOpen() { return !!root && root.classList.contains("is-open"); }

  return { open: open, close: close, run: run, isOpen: isOpen, mount: mount,
           render: render, showTab: showTab, tab: function () { return sideTab; } };
})();

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("resize", () => {
    const host = document.getElementById("opStage");
    if (host && Operator.isOpen()) { fitOperatorStage(host); positionOperatorPointer(host); }
  });
}
