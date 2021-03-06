// ==UserScript==
// @name        Retry Image Loading
// @description Automatically tries to reload an image when a load error occurs. Also adds menu for image reloading.
// @namespace   https://github.com/mimakyure/
// @author      mimakyure
// @version     1.2.0
// @grant       none
// @match       https://*/*
// @match       http://*/*
// @homepageURL https://github.com/mimakyure/userscripts
// @supportURL  https://github.com/mimakyure/userscripts/issues
// @updateURL   https://openuserjs.org/meta/mimakyure/Retry_Image_Loading.meta.js
// @license     MIT
// ==/UserScript==

/* Comments:
   Another script to compensate for my poor internet connection.
 */

(() => {

  const NS = "gm-retry-image-loading";


  // Attach a self-removing event listener
  function addListener(elm, types_str, callback) {

    // Handle multiple event types
    const types = types_str.split(" ");

    const cb = evt => {

      callback(evt);

      types.forEach(type => {

        elm.removeEventListener(type, cb);
      });
    };

    types.forEach(type => {

      elm.addEventListener(type, cb);
    });

  }


  // Add psuedo-selector/element related CSS to the page
  function addStyle(btn_height, img_count) {

    const style = document.createElement("style");

    style.textContent =
      `.${NS}-menu {
         opacity:    0.5;
       }

       .${NS}-menu > div {
         visibility: hidden;
       }

       .${NS}-menu > div:first-child {
         height:     ${btn_height}px;
         width:      ${btn_height + 4}px;
       }

       .${NS}-menu > div > button {
         height:     0;
         width:      ${btn_height + 4}px;
         background: black;
       }

       img:hover + .${NS}-menu > div:first-child,
       .${NS}-menu:hover > div:last-child > button {
         height:     ${btn_height}px;
         width:      100%;
         visibility: visible;
       }

       .${NS}-menu:hover {
         opacity:    1;
       }

       .${NS}-menu:hover > div:first-child {
         height:     0;
       }

       .${NS}-menu > div > button:hover {
         background: DarkSlateGray;
       }

       #${NS}-notify.${NS}-reloading:before {
         content:    'Reloading images: ';
       }

       #${NS}-notify.${NS}-reloading:after {
         content:    ' / ${img_count}';
       }

       #${NS}-notify.${NS}-offline:before {
         content:    'Offline: ';
       }`;

    document.head.appendChild(style);
  }


  // Hide count of auto-reloading items
  function hideNotification() {

    hideNotification.tid = setTimeout(() => {

      const notify = document.getElementById(`${NS}-notify`);
      notify.style.height     = "0";
      notify.style.visibility = "hidden";

    }, 3000);
  }


  // Make visible count of reloading images
  function showNotification(count) {

    clearTimeout(hideNotification.tid);

    const notify = document.getElementById(`${NS}-notify`);
    notify.textContent      = count;
    notify.style.height     = "";
    notify.style.visibility = "visible";

    if (!count) {

      hideNotification();
    }
  }


  // Update acount of auto-reloading items or indicate offline status
  function updateNotification(inc) {

    const notify = document.getElementById(`${NS}-notify`);
    updateNotification.count += inc;

    // Change class name to update notification pseudo-element text
    notify.className = NS + (inc ? "-reloading" : "-offline");

    showNotification(updateNotification.count);
  }


  // Setup notification of current image reload count
  function initNotification() {

    const notify = document.createElement("div");
    notify.id = `${NS}-notify`;
    notify.textContent = "0";
    notify.style.cssText = `position:   fixed;
                            top:        0;
                            right:      0;
                            height:     0;
                            padding:    5px;
                            visibility: hidden;
                            background: black;
                            color:      white;
                            opacity:    0.5;
                            z-index:    10;`;

    document.body.appendChild(notify);

    updateNotification.count = 0;
  }


  // Update indicators to show reload completed
  function finishLoad(evt) {

    const img = evt.currentTarget;

    img.removeAttribute(`${NS}-reloading`);

    // Override in-page hiding of unloaded images when reloading done
    if (img.style.display == "none") {

      img.style.display = "";
    }
    img.style.visibilty = "";

    updateNotification(-1);
  }


  // Re-set src attribute on img element to trigger reloading of data
  function refreshSrc(img) {

    // Perform reloading
    img.setAttribute(`${NS}-reloading`, "");
    addListener(img, "load error", finishLoad);

    img.src = img.src;
  }


  // Check if image should be refreshed and initiate action
  function setRefresh(img) {

    // Check if reload already triggered on this img
    if (img.hasAttribute(`${NS}-reloading`)) {

      return;
    }

    updateNotification(1);

    // Check that at least network connection exists, though maybe not online
    if (navigator.onLine) {

      refreshSrc(img);

    } else {

      addListener(window, "online", refreshSrc.bind(null, img));
    }
  }


  // Attempt to reload image data by refreshing src attribute
  function reloadImg(delay = 0) {

    // Use delay to avoid constant reloading if no internet
    setTimeout(setRefresh.bind(null, this), delay);

    // Hide menu button after clicked
    this.nextSibling.style.display = "none";
    return false;
  }


  // Reload all images on the page
  function reloadAllImg() {

    document.querySelectorAll('img').forEach(setRefresh);

    // Hide menu button after clicked
    this.style.display = "none";
    return false;
  }


  // Create menu for reloading image src
  function createMenu(img) {

    // Set rules directly on elements to help ensure desired styling
    const css = {"shared": `color:         white;
                            text-align:    center;
                            border:        none;
                            border-radius: 0;
                            margin:        0;
                            display:       block;
                            box-shadow:    none;
                            min-height:    0;`,
                 "toggle": `padding:       0;
                            background:    black;
                            font-size:     ${createMenu.btn_height}px;
                            line-height:   ${createMenu.btn_height}px;`,
                 "button": `padding:       0 5px;
                            font-size:     14px;`};

    const menu = document.createElement("div");
    menu.className = `${NS}-menu`;
    menu.style.cssText = `position: absolute;
                          z-index:n 10;`;
    menu.innerHTML =
        `<div style="${css.shared + css.toggle}">&#183;&#183;&#183;</div>
         <div>
           <button type="button" title="Reload Image"
               style="${css.shared + css.button}">Reload Image</button>
           <button type="button" title="Reload All Images"
               style="${css.shared + css.button}">Reload All Images</button>
         </div>`;

    menu.lastChild.firstElementChild.
        addEventListener("click", reloadImg.bind(img));
    menu.lastChild.lastElementChild.
        addEventListener("click", reloadAllImg.bind(menu));

    return menu;
  }


  // Reset menu display and position for future reveal when mouse leaves image
  function leaveImage(evt) {

    const menu = evt.currentTarget.nextSibling;

    menu.style.display = "";

    // Mouse did not move from image to menu
    if (evt.relatedTarget.offsetParent != menu) {

      menu.style.top = "";
    }
  }


  // Reset menu display and position for future reveal when mouse leaves menu
  function leaveMenu(evt) {

    const menu = evt.currentTarget;

    menu.style.display = "";

    // Mouse did not move from menu to image
    if (evt.relatedTarget != menu.previousSibling) {

      menu.style.top = "";
    }
  }


  // Place menu along inside edge of image at level of mouse entry
  function positionMenu(evt) {

    const img = evt.currentTarget;
    const menu = img.nextSibling;

    // CSS top rule presence used to signal if menu should be repositioned
    if (menu.style.top) {

      return;
    }

    const parent_box = img.offsetParent.getBoundingClientRect();
    const parent_top = window.pageYOffset + parent_box.top;

    const img_box = img.getBoundingClientRect();
    const img_btm = parent_top + img.offsetTop + img_box.height;

    const menu_top = Math.min(
        evt.pageY - parent_top + Math.min(10, img_btm - evt.pageY),
        img_btm - Math.min(menu.offsetHeight*2, img_box.height));

    menu.style.top = Math.round(menu_top) + "px";


    // Closer to right, align right
    if (evt.pageX > window.pageXOffset + img_box.left + img_box.width/2) {

      menu.style.left = "";
      menu.style.right = parent_box.width - (img.offsetLeft + img.width) + "px";

    // Closer to left, align left
    } else {

      menu.style.right = "";
      menu.style.left = img.offsetLeft + "px";
    }
  }


  // Add reloading menu to targeted images
  function addReloadMenu(img) {

    // Add helper menu only on larger images
    if (img.height*img.width < 40000 ||
        (img.nextSibling && img.nextSibling.className == `${NS}-menu`)) {

      return;
    }

    const menu = createMenu(img);
    img.insertAdjacentElement("afterend", menu);

    // Handle menu visibility and positioning
    img.addEventListener("mouseout", leaveImage);
    menu.addEventListener("mouseleave", leaveMenu);
    img.addEventListener("mouseover", positionMenu);
  }


  // Respond to image load error
  function errorHandler(evt) {

    reloadImg.call(evt.currentTarget, 3000);
    addReloadMenu(evt.currentTarget);
  }


  // Followup after successful load
  function loadHandler(evt) {

    const img = evt.currentTarget;

    addReloadMenu(img);

    // Cleanup event listeners
    img.removeEventListener("error", errorHandler);
    img.removeEventListener("load", loadHandler);
  }


  // Monitor image loading to run reload enhancements
  function processImages(imgs) {

    imgs.filter(img => !img.complete).forEach(img => {

      img.addEventListener("error", errorHandler);
      img.addEventListener("load", loadHandler);
    });
  }


  // Setup
  function init() {

    const btn_height = 24;
    const imgs = Array.from(document.getElementsByTagName("img"));


    createMenu.btn_height = btn_height;

    addStyle(btn_height, imgs.length);

    initNotification();


    processImages(imgs);
  }

  init();

})();
