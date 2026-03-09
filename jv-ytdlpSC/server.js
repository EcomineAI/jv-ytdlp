const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');

const PORT = 3000;
const clients = new Map(); // SSE connections
const processes = new Map(); // active downloads

function findYtDlp() {
  const candidates = [
    path.join(os.homedir(), 'Downloads', 'yt-dlp.exe'),
    path.join(os.homedir(), 'Downloads', 'yt-dlp'),
    path.join(os.homedir(), 'Desktop', 'yt-dlp.exe'),
    path.join(os.homedir(), 'Desktop', 'yt-dlp'),
    'yt-dlp.exe', 'yt-dlp',
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return 'yt-dlp';
}

function sendSSE(id, data) {
  const client = clients.get(id);
  if (client) client.write(`data: ${JSON.stringify(data)}\n\n`);
}

function parseProgress(line) {
  const frag = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\s*\S+)\s+at\s+([\d.]+\s*\S+)\s+ETA\s+([\d:]+)\s+\(frag\s+(\d+)\/(\d+)\)/);
  if (frag) return { type:'progress', percent:parseFloat(frag[1]), size:frag[2], speed:frag[3], eta:frag[4], fragCurrent:parseInt(frag[5]), fragTotal:parseInt(frag[6]), mode:'frag' };

  const std = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\s*\S+)\s+at\s+([\d.]+\s*\S+)\s+ETA\s+([\d:]+)/);
  if (std) return { type:'progress', percent:parseFloat(std[1]), size:std[2], speed:std[3], eta:std[4], mode:'percent' };

  const dest = line.match(/\[download\] Destination: (.+)/);
  if (dest) return { type:'destination', file:dest[1].trim() };

  if (line.includes('Merging formats')) return { type:'merging' };
  if (line.includes('has already been downloaded')) {
    const m = line.match(/\[download\] (.+) has already been downloaded/);
    return { type:'already_done', file: m ? m[1].trim() : '' };
  }
  return null;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve frontend
  if (req.method === 'GET' && parsed.pathname === '/') {
    const locations = [path.join(__dirname, 'index.html'), path.join(os.homedir(), 'Desktop', 'index.html')];
    const htmlFile = locations.find(p => fs.existsSync(p));
    if (htmlFile) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(fs.readFileSync(htmlFile, 'utf8')); }
    else { res.writeHead(404); res.end('index.html not found.'); }
    return;
  }

  // Serve static assets (logo, images, etc.)
  const staticExts = { '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.gif':'image/gif', '.webp':'image/webp' };
  const ext = path.extname(parsed.pathname).toLowerCase();
  if (req.method === 'GET' && staticExts[ext]) {
    const fileName = path.basename(parsed.pathname);
    const baseDirs = [__dirname, path.join(os.homedir(), 'Desktop'), path.join(os.homedir(), 'Downloads')];
    const found = baseDirs.map(d => path.join(d, fileName)).find(p => fs.existsSync(p));
    if (found) {
      res.writeHead(200, { 'Content-Type': staticExts[ext] });
      fs.createReadStream(found).pipe(res);
    } else {
      res.writeHead(404); res.end('Asset not found: ' + fileName);
    }
    return;
  }

  // Open folder in Explorer
  if (req.method === 'POST' && parsed.pathname === '/open-folder') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { path: folderPath } = JSON.parse(body || '{}');
      const target = (folderPath && folderPath.trim()) ? folderPath.trim() : path.join(os.homedir(), 'Downloads');
      const { exec } = require('child_process');
      // Windows: explorer, Mac: open, Linux: xdg-open
      const cmd = process.platform === 'win32' ? `explorer "${target}"` : process.platform === 'darwin' ? `open "${target}"` : `xdg-open "${target}"`;
      exec(cmd);
      res.writeHead(200); res.end('ok');
    });
    return;
  }

  // Quit server
  if (req.method === 'POST' && parsed.pathname === '/quit') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'shutting_down' }));
    console.log('\n👋 Server stopped by user.\n');
    setTimeout(() => process.exit(0), 300);
    return;
  }

  // SSE
  if (req.method === 'GET' && parsed.pathname === '/events') {
    const id = parsed.query.id;
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive' });
    res.write(':\n\n');
    clients.set(id, res);
    req.on('close', () => clients.delete(id));
    return;
  }

  // GET available formats
  if (req.method === 'POST' && parsed.pathname === '/formats') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { videoUrl } = JSON.parse(body || '{}');
      if (!videoUrl) { res.writeHead(400); res.end('Missing videoUrl'); return; }

      const ytdlp = findYtDlp();
      const proc = spawn(ytdlp, ['-F', '--no-warnings', videoUrl], { shell: false, windowsHide: true });
      let output = '';
      proc.stdout.on('data', c => output += c.toString());
      proc.stderr.on('data', c => output += c.toString());
      proc.on('close', () => {
        // parse heights from yt-dlp -F output
        const heights = new Set();
        output.split('\n').forEach(line => {
          // Match lines like: 137  mp4  1920x1080  ...
          const m = line.match(/^\d+\s+\S+\s+\d+x(\d+)/);
          if (m) heights.add(parseInt(m[1]));
        });
        const sorted = [...heights].sort((a,b) => b - a);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ qualities: sorted, raw: output }));
      });
      proc.on('error', () => {
        res.writeHead(500); res.end(JSON.stringify({ qualities: [], error: 'yt-dlp error' }));
      });
    });
    return;
  }

  // Cancel
  if (req.method === 'POST' && parsed.pathname === '/cancel') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { sessionId } = JSON.parse(body || '{}');
      const proc = processes.get(sessionId);
      if (proc) {
        proc.kill('SIGTERM');
        try { process.kill(proc.pid, 'SIGKILL'); } catch {}
        processes.delete(sessionId);
        sendSSE(sessionId, { type:'cancelled', message:'⛔ Download cancelled.' });
      }
      res.writeHead(200); res.end('ok');
    });
    return;
  }

  // Download
  if (req.method === 'POST' && parsed.pathname === '/download') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { res.writeHead(400); res.end('Bad JSON'); return; }
      const { videoUrl, quality, outputPath, audioOnly, sessionId, force } = data;
      if (!videoUrl || !sessionId) { res.writeHead(400); res.end('Missing fields'); return; }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'started' }));

      const saveDir = (outputPath && outputPath.trim()) ? outputPath.trim() : path.join(os.homedir(), 'Downloads');

      // Auto-number output: %(title)s.%(ext)s, then %(title)s (1).%(ext)s etc.
      // yt-dlp handles this natively with --no-overwrites + autonumber via output template
      // We use a custom template that appends (N) if file exists
      const outputTemplate = path.join(saveDir, '%(title)s.%(ext)s');
      const outputTemplateAudio = path.join(saveDir, '%(title)s.%(ext)s');

      const args = [];
      if (audioOnly) {
        args.push('-x', '--audio-format', 'mp3');
      } else {
        const fmt = quality === 'best'
          ? 'bestvideo+bestaudio/best/b'
          : [
              `bestvideo[height=${quality}][vcodec!*=av01]+bestaudio[ext=m4a]/`,
              `bestvideo[height=${quality}]+bestaudio/`,
              `bestvideo[height<=${quality}]+bestaudio/`,
              `best[height<=${quality}]/`,
              `best`
            ].join('');
        args.push('-f', fmt, '--merge-output-format', 'mp4');
      }

      if (force) {
        // User confirmed re-download — overwrite existing file
        args.push('--force-overwrites');
      } else {
        // Auto-number: if file exists, yt-dlp will rename to Title (1).ext, Title (2).ext etc.
        args.push('--no-overwrites', '--autonumber-start', '1');
      }

      args.push('-o', outputTemplate, '--newline', '--no-part', '--audio-multistreams', videoUrl);

      const ytdlp = findYtDlp();
      sendSSE(sessionId, { type:'log', message:`yt-dlp: ${ytdlp}` });
      sendSSE(sessionId, { type:'log', message:`Save to: ${saveDir}` });

      const proc = spawn(ytdlp, args, { shell: false, windowsHide: true });
      processes.set(sessionId, proc);
      let destCount = 0, phase = 'video';

      proc.stdout.on('data', chunk => {
        chunk.toString().split('\n').forEach(line => {
          if (!line.trim()) return;
          sendSSE(sessionId, { type:'log', message:line });
          const p = parseProgress(line);
          if (!p) return;
          if (p.type === 'destination') { destCount++; phase = destCount === 1 ? 'video' : 'audio'; sendSSE(sessionId, { ...p, phase }); }
          else if (p.type === 'progress') sendSSE(sessionId, { ...p, phase });
          else sendSSE(sessionId, p);
        });
      });

      proc.stderr.on('data', chunk => {
        chunk.toString().split('\n').forEach(line => { if (line.trim()) sendSSE(sessionId, { type:'warning', message:line }); });
      });

      proc.on('close', code => {
        processes.delete(sessionId);
        if (code === 0) sendSSE(sessionId, { type:'done', message:'Download complete!' });
        else if (code !== null) sendSSE(sessionId, { type:'error', message:`Process exited with code ${code}` });
      });

      proc.on('error', err => { sendSSE(sessionId, { type:'error', message:`❌ Cannot run yt-dlp: ${err.message}` }); });
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  const ytdlp = findYtDlp();
  console.log(`\n🎬 jv-ytdlp v0.1 → http://localhost:${PORT}`);
  console.log(`📦 yt-dlp: ${ytdlp}`);
  console.log(`📁 Default save: ${path.join(os.homedir(), 'Downloads')}\n`);
});