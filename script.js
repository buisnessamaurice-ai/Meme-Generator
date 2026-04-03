const canvas = document.getElementById('meme-canvas');
const ctx = canvas.getContext('2d');

let currentImage = null;
let textAlign = 'left';

const TEMPLATES = [
  { name: "Drake",          url: "https://i.imgflip.com/30b1gx.jpg" },
  { name: "Distracted BF",  url: "https://i.imgflip.com/1ur9b0.jpg" },
  { name: "Two Buttons",    url: "https://i.imgflip.com/1g8my4.jpg" },
  { name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg" },
  { name: "Expanding Brain",url: "https://i.imgflip.com/1jwhww.jpg" },
  { name: "This is Fine",   url: "https://i.imgflip.com/wxica.jpg" },
];

// Build template buttons from the array
const grid = document.getElementById('templates');
TEMPLATES.forEach(tpl => {
  const btn = document.createElement('button');
  btn.className = 'tpl-btn';
  btn.title = tpl.name;
  const img = document.createElement('img');
  img.src = tpl.url;
  img.alt = tpl.name;
  img.loading = 'lazy';
  btn.appendChild(img);
  btn.onclick = () => {
    document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    loadImageFromURL(tpl.url);
  };
  grid.appendChild(btn);
});


// Toggle a collapsible sub-section open/closed
function toggleSub(key) {
  const header = document.querySelector(`.sub-divider[onclick="toggleSub('${key}')"]`);
  const body   = document.getElementById('sub-' + key);
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  header.classList.toggle('open', !isOpen);
}


// Highlight the active alignment button and store the value
function setAlign(value) {
  textAlign = value;
  ['left', 'center', 'right'].forEach(a => {
    document.getElementById('align-' + a).classList.toggle('active', a === value);
  });
  redraw();
}


function handleUpload(input) {
  const file = input.files[0];
  if (!file) return;
  // FileReader converts the local file into a base64 URL we can draw
  const reader = new FileReader();
  reader.onload = (e) => loadImageFromURL(e.target.result);
  reader.readAsDataURL(file);
}


function loadImageFromURL(url) {
  const img = new Image();
  // crossOrigin must be set before .src — without it canvas export breaks
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    currentImage = img;
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    redraw();
  };
  img.onerror = () => alert('Could not load image. Try uploading directly.');
  img.src = url;
}


function redraw() {
  if (!currentImage) return;

  // Wipe the canvas before redrawing so old text doesn't bleed through
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

  const fontSize    = parseInt(document.getElementById('fontSize').value);
  const fontFamily  = document.getElementById('fontFamily').value;
  const textColor   = document.getElementById('textColor').value;
  const strokeColor = document.getElementById('strokeColor').value;
  const strokeWidth = parseInt(document.getElementById('strokeWidth').value);
  const opacity     = parseInt(document.getElementById('textOpacity').value) / 100;
  const allCaps     = document.getElementById('allCaps').checked;
  const shadowOn    = document.getElementById('shadowOn').checked;
  const shadowColor = document.getElementById('shadowColor').value;
  const shadowBlur  = parseInt(document.getElementById('shadowBlur').value);
  const shadowOffX  = parseInt(document.getElementById('shadowX').value);
  const shadowOffY  = parseInt(document.getElementById('shadowY').value);

  // Convert percentage sliders to actual pixel coordinates
  const topY    = canvas.height * (parseInt(document.getElementById('topY').value)    / 100);
  const bottomY = canvas.height * (parseInt(document.getElementById('bottomY').value) / 100);
  const textX   = canvas.width  * (parseInt(document.getElementById('textX').value)   / 100);

  let topText    = document.getElementById('topText').value;
  let bottomText = document.getElementById('bottomText').value;

  if (allCaps) {
    topText    = topText.toUpperCase();
    bottomText = bottomText.toUpperCase();
  }

  // globalAlpha affects everything drawn after it — reset to 1 after text
  ctx.globalAlpha = opacity;
  ctx.font        = `700 ${fontSize}px '${fontFamily}', sans-serif`;
  ctx.fillStyle   = textColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth   = strokeWidth;
  ctx.textAlign   = textAlign;
  ctx.lineJoin    = 'round'; // smooth corners where stroke lines meet

  if (shadowOn) {
    ctx.shadowColor   = shadowColor;
    ctx.shadowBlur    = shadowBlur;
    ctx.shadowOffsetX = shadowOffX;
    ctx.shadowOffsetY = shadowOffY;
  } else {
    // Reset shadow so it doesn't bleed into the next redraw
    ctx.shadowColor   = 'transparent';
    ctx.shadowBlur    = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  if (topText)    drawWrappedText(topText,    textX, topY,    fontSize, strokeWidth);
  if (bottomText) drawWrappedText(bottomText, textX, bottomY, fontSize, strokeWidth);

  ctx.globalAlpha = 1;
}


function drawWrappedText(text, x, y, fontSize, strokeWidth) {
  const maxWidth   = canvas.width * 0.9;
  const lineHeight = fontSize * 1.15;

  // Canvas has no built-in wrapping — we measure word by word manually
  const words = text.split(' ');
  const lines  = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  lines.forEach((line, i) => {
    const lineY = y + i * lineHeight;
    // Stroke drawn first (underneath), fill drawn on top
    if (strokeWidth > 0) ctx.strokeText(line, x, lineY);
    ctx.fillText(line, x, lineY);
  });
}


function downloadMeme(format) {
  if (!currentImage) { alert('Load an image first!'); return; }
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  // toDataURL encodes every canvas pixel into a base64 image string
  const dataURL  = canvas.toDataURL(mimeType, 0.92);
  // Click a temporary invisible <a> to trigger the browser save dialog
  const link     = document.createElement('a');
  link.href      = dataURL;
  link.download  = `meme.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


function copyToClipboard() {
  if (!currentImage) { alert('Load an image first!'); return; }

  const btn = document.getElementById('copyBtn');

  /*
    canvas.toBlob() is like toDataURL() but gives us a raw binary Blob
    instead of a base64 string. The Clipboard API requires a Blob —
    it can't accept a base64 string directly.
  */
  canvas.toBlob((blob) => {
    const item = new ClipboardItem({ 'image/png': blob });

    /*
      navigator.clipboard.write() is the modern clipboard API.
      It's async (returns a Promise), so we use .then() for success
      and .catch() for when the browser blocks it.
    */
    navigator.clipboard.write([item])
      .then(() => {
        // Briefly change the button to give visual feedback
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy image';
          btn.classList.remove('copied');
        }, 2000);
      })
      .catch(() => {
        alert('Copy failed — try downloading instead. Some browsers block clipboard access.');
      });
  }, 'image/png');
}


// Drag-and-drop on the upload zone
const uploadZone = document.querySelector('.upload-zone');

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault(); // required — browser blocks drops unless you cancel this
  uploadZone.style.borderColor = '#f5c400';
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.style.borderColor = '';
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (ev) => loadImageFromURL(ev.target.result);
    reader.readAsDataURL(file);
  }
});
