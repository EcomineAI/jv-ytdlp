```
███████╗ ██████╗ ██████╗ ███╗   ███╗██╗███╗   ██╗███████╗ █████╗ ██╗
██╔════╝██╔════╝██╔═══██╗████╗ ████║██║████╗  ██║██╔════╝██╔══██╗██║
█████╗  ██║     ██║   ██║██╔████╔██║██║██╔██╗ ██║█████╗  ███████║██║
██╔══╝  ██║     ██║   ██║██║╚██╔╝██║██║██║╚██╗██║██╔══╝  ██╔══██║██║
███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║██║██║ ╚████║███████╗██║  ██║██║
╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝

  jv-ytdlp v0.2  —  Browser-based YouTube downloader powered by yt-dlp
```

---

[![Version](https://img.shields.io/badge/version-v0.2-00aaff?style=flat-square)](https://github.com/EcomineAI)
[![Platform](https://img.shields.io/badge/platform-Windows-0066ff?style=flat-square)](https://github.com/EcomineAI)
[![License](https://img.shields.io/badge/license-MIT-00ffff?style=flat-square)](LICENSE.txt)
[![Node](https://img.shields.io/badge/node-%3E%3D18-00ff88?style=flat-square)](https://nodejs.org)
[![yt-dlp](https://img.shields.io/badge/powered%20by-yt--dlp-ff6600?style=flat-square)](https://github.com/yt-dlp/yt-dlp)

---

## What is this?

**jv-ytdlp** is a local desktop app that runs on your Windows PC and lets you download YouTube videos through a clean browser UI — no command line needed after setup.

Paste a URL → pick quality → download. That's it.

---

## Download — v0.2

Two options are available from the [Releases](https://github.com/EcomineAI/jv-ytdlp/releases/tag/v0.2) page:

| File | Description |
|------|-------------|
| `JVDownloader.Setup.0.2.0.exe` | **Recommended.** One-click installer — installs the app, creates a desktop shortcut, and handles everything automatically. |
| `jv-ytdlp-0.2.0-source.zip` | Source code archive. For developers who want to inspect, modify, or build from scratch. Requires Node.js ≥ 18. |

> **Just want to download videos?** Grab the `.exe` installer. No Node.js required.

---

## Features

- Smart quality detection — only shows resolutions the video actually has
- Real-time progress bar with speed, ETA, and fragment counter
- Auto-merges video + audio using ffmpeg into a clean `.mp4`
- Audio-only MP3 mode
- Cancel download mid-way
- Live log console
- Neo-blue UI
- One-click installer — downloads yt-dlp and ffmpeg automatically on first launch

---

## Install (exe — recommended)

1. Download `jv-ytdlp Setup 0.2.0.exe` from [Releases](https://github.com/EcomineAI/jv-ytdlp/releases/tag/v0.2)
2. Run the installer
3. Launch **JVDownloader** from your desktop or Start Menu
4. On first launch, click **Install Tools** — yt-dlp and ffmpeg download automatically (~30 MB, one time only)
5. Click **Launch App** — done

---

## Build from Source (zip)

For developers only.

### Requirements

- Windows 10 / 11
- Node.js ≥ 18 — [nodejs.org](https://nodejs.org)

### Steps

```
1. Download and extract jv-ytdlp-0.2.0-source.zip
2. Open a terminal in the extracted folder
3. Run BUILD.bat  (or: npm install && npm run build)
4. Installer outputs to:  dist\jv-ytdlp Setup 0.2.0.exe
```

Or to run without building:

```
npm install
npm start
```

---

## Usage

1. Paste a YouTube URL
2. App auto-detects available qualities (~2 sec)
3. Pick quality from the dropdown
4. Optionally change the save folder or toggle MP3 mode
5. Click **DOWNLOAD**
6. File saves to your Downloads folder (or chosen folder)

---

## Files (source)

```
jv-ytdlp/
├── main.js          — Electron main process + HTTP server
├── preload.js       — Electron preload / IPC bridge
├── index.html       — Downloader UI
├── setup.html       — First-time setup screen
├── icon.ico         — App icon (Windows)
├── icon.png         — App icon (UI)
├── package.json     — Build config
├── BUILD.bat        — One-click build script
├── LICENSE.txt
└── README.md
```

---

## How it works

The app runs a local HTTP server on port `57329`. The Electron window loads the UI from that server. yt-dlp and ffmpeg are downloaded once to `~/.jv-ytdlp/tools/` on first launch and reused on every subsequent run.

---

## Troubleshooting

**Setup screen appears on every launch**
→ yt-dlp or ffmpeg may have failed to download. Click Install Tools again.

**No audio in downloaded video**
→ ffmpeg may not have installed correctly. Re-run setup from the app menu.

**Quality shows only "Best Available"**
→ Format scan failed — download still works using best available quality.

**Windows SmartScreen warning on installer**
→ Expected for unsigned apps. Click "More info" → "Run anyway". The app is open source — inspect the code in the source zip if you'd like to verify.

---

## Legal

For personal use only. Downloading copyrighted content without permission may violate YouTube's Terms of Service. The developer is not responsible for misuse.

---

## License

MIT © 2025 JV / EcomineAI — see [LICENSE.txt](LICENSE.txt)

---

## Supported Sites

yt-dlp supports over 1,800 websites. Below are the most popular ones.

### Video Platforms
| Site | Notes |
|------|-------|
| YouTube | Videos, Shorts, playlists, channels, live streams |
| Vimeo | Public and unlisted videos |
| Dailymotion | Videos and playlists |
| Twitch | VODs, clips, live streams |
| Bilibili | Chinese video platform |
| Niconico | Japanese video platform |
| Rumble | Videos and live streams |
| Odysee / LBRY | Decentralized video |
| PeerTube | Federated video instances |

### Social Media
| Site | Notes |
|------|-------|
| Twitter / X | Videos and GIFs in tweets |
| Instagram | Reels, posts, stories (public) |
| TikTok | Videos and slideshows |
| Facebook | Public videos and reels |
| Reddit | Video posts |
| Threads | Video posts |
| Snapchat | Public spotlight videos |
| Pinterest | Video pins |

### Music & Audio
| Site | Notes |
|------|-------|
| SoundCloud | Tracks and playlists |
| Bandcamp | Tracks and albums |
| Audiomack | Tracks and albums |
| Mixcloud | DJ mixes and shows |

### News & Media
| Site | Notes |
|------|-------|
| BBC | News videos and iPlayer clips |
| CNN | Video articles |
| The Guardian | Video articles |
| NBC News | Video clips |
| ABC News | Video clips |
| Al Jazeera | News videos |

### Streaming & TV
| Site | Notes |
|------|-------|
| Crunchyroll | Anime (free tier) |
| Funimation | Anime (free tier) |
| ESPN | Free clips |
| Bloomberg | Free videos |

### Educational
| Site | Notes |
|------|-------|
| TED | Talks and playlists |
| Khan Academy | Lessons |
| Coursera | Free preview videos |
| Udemy | Free preview videos |
| LinkedIn Learning | Free preview videos |

### Other Notable Sites
| Site | Notes |
|------|-------|
| Streamable | Short video clips |
| Imgur | Video posts |
| Gfycat | GIF videos |
| Coub | Short loops |
| VK | Russian social video |
| OK.ru | Russian social video |
| Weibo | Chinese social video |

> **Note:** This is not the full list. yt-dlp supports 1,800+ sites total.
> Full list: [github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
>
> Some sites may require login cookies or may be geo-restricted.
> Not every site is guaranteed to work — platforms change frequently.
