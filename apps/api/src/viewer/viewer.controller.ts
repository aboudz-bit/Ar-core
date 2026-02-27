import { Controller, Get, Post, Body, Param, Query, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import { ViewerService } from './viewer.service';
import { AuthService } from '../auth/auth.service';
import { ApiTokensService } from '../api-tokens/api-tokens.service';
import { RateLimiterService } from '../common/services/rate-limiter.service';

@Controller()
export class ViewerController {
  private rateLimiter = new RateLimiterService();

  constructor(
    private viewerService: ViewerService,
    private authService: AuthService,
    private apiTokensService: ApiTokensService,
  ) {}

  // Viewer page data endpoint
  @Get('v/:companySlug/:sku')
  async viewerPage(
    @Param('companySlug') companySlug: string,
    @Param('sku') sku: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    // Rate limit: 100 requests per minute per IP
    const ip = res.req.ip || 'unknown';
    const allowed = await this.rateLimiter.isAllowed(`viewer:${ip}`, 100, 60000);
    if (!allowed) {
      return res.status(429).json({ error: 'تم تجاوز الحد المسموح. حاول لاحقاً' });
    }

    try {
      if (token) {
        this.authService.verifyViewerToken(token);
      }

      const { product } = await this.viewerService.getViewerData(companySlug, sku);

      // Resolve base URL from the incoming request (works on LAN / tunnels)
      const proto = res.req.headers['x-forwarded-proto'] || res.req.protocol || 'http';
      const host = res.req.headers['x-forwarded-host'] || res.req.headers.host;
      const baseUrl = `${proto}://${host}`;

      const config = product.configs[0];
      const glbAsset = product.assets.find((a: any) => a.type === 'placement_glb' || a.type === 'tryon_glb');
      const usdzAsset = product.assets.find((a: any) => a.type === 'usdz');

      const html = this.generateViewerHtml(product, config, glbAsset, usdzAsset, companySlug, baseUrl);
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } catch (error: any) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  // API: Request viewer token (used by embed.js)
  @Post('api/viewer/token')
  async requestViewerToken(
    @Body() body: { companySlug: string; sku: string },
    @Headers('x-api-key') apiKey: string,
  ) {
    if (apiKey) {
      const tokenData = await this.apiTokensService.validateToken(apiKey);
      if (!tokenData) return { success: false, error: 'Invalid API key' };
    }

    const { company, product } = await this.viewerService.getViewerData(body.companySlug, body.sku);
    const token = this.authService.generateViewerToken(company.id, product.id, body.sku);

    return { success: true, data: { token } };
  }

  // API: Start session
  @Post('api/viewer/session/start')
  async startSession(@Body() body: {
    companySlug: string;
    sku: string;
    viewerType: string;
    device: object;
    referrer?: string;
  }) {
    const { company, product } = await this.viewerService.getViewerData(body.companySlug, body.sku);
    const session = await this.viewerService.startSession(
      company.id, product.id, body.sku, body.viewerType, body.device, body.referrer,
    );
    return { success: true, data: { sessionId: session.id } };
  }

  // API: End session
  @Post('api/viewer/session/end')
  async endSession(@Body() body: { sessionId: string }) {
    await this.viewerService.endSession(body.sessionId);
    return { success: true };
  }

  // API: Log event
  @Post('api/viewer/event')
  async logEvent(@Body() body: {
    companyId: string;
    sessionId: string;
    type: string;
    payload: object;
  }) {
    await this.viewerService.logEvent(body.companyId, body.sessionId, body.type, body.payload || {});
    return { success: true };
  }

  // Embed.js — derives API_URL from the script src so it works from any host/IP
  @Get('embed.js')
  async embedScript(@Res() res: Response) {
    const js = `(function(){
  // Derive API base from this script's own src URL
  var scripts = document.getElementsByTagName('script');
  var thisScript = null;
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('embed.js') !== -1) { thisScript = scripts[i]; break; }
  }
  var API_URL = thisScript ? thisScript.src.replace(/\\/embed\\.js.*$/, '') : '';

  function init() {
    var elements = document.querySelectorAll('[data-ar-sku]');
    var companyEl = document.querySelector('script[data-company]');
    var company = companyEl ? companyEl.getAttribute('data-company') : '';

    elements.forEach(function(el) {
      var sku = el.getAttribute('data-ar-sku');
      var btn = document.createElement('button');
      btn.textContent = '\\u062C\\u0631\\u0651\\u0628 \\u0628\\u0627\\u0644\\u0648\\u0627\\u0642\\u0639 \\u0627\\u0644\\u0645\\u0639\\u0632\\u0632';
      btn.style.cssText = 'background:#6366f1;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:16px;font-family:inherit;direction:rtl;';
      btn.onclick = function() { openViewer(company, sku); };
      el.appendChild(btn);
    });
  }

  function openViewer(company, sku) {
    fetch(API_URL + '/api/viewer/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companySlug: company, sku: sku })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success) return;
      var url = API_URL + '/v/' + company + '/' + sku + '?token=' + data.data.token;
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;';
      var close = document.createElement('button');
      close.textContent = '\\u00D7';
      close.style.cssText = 'position:absolute;top:16px;right:16px;background:none;border:none;color:#fff;font-size:32px;cursor:pointer;z-index:100000;';
      close.onclick = function() { document.body.removeChild(overlay); };
      var iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.cssText = 'width:90%;max-width:500px;height:80%;border:none;border-radius:16px;';
      iframe.setAttribute('allow', 'camera;xr-spatial-tracking;accelerometer;gyroscope');
      overlay.appendChild(close);
      overlay.appendChild(iframe);
      document.body.appendChild(overlay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`;

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(js);
  }

  private generateViewerHtml(
    product: any,
    config: any,
    glbAsset: any,
    usdzAsset: any,
    companySlug: string,
    baseUrl: string,
  ): string {
    const glbUrl = glbAsset ? `${baseUrl}/uploads/${glbAsset.path}` : '';
    const usdzUrl = usdzAsset ? `${baseUrl}/uploads/${usdzAsset.path}` : '';
    const viewerType = config?.viewerType || 'placement';
    const scale = config?.scale || 1;

    // iOS Quick Look needs USDZ via ios-src; falls back to GLB-only scene-viewer on Android
    const iosSrcAttr = usdzUrl ? `ios-src="${usdzUrl}"` : '';
    // Prefer quick-look first so iOS picks it up; scene-viewer for Android; webxr as fallback
    const arModes = 'quick-look scene-viewer webxr';

    const hasModel = !!(glbUrl || usdzUrl);
    const srcAttr = glbUrl ? `src="${glbUrl}"` : (usdzUrl ? `src="${usdzUrl}"` : '');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${product.nameAr} - عارض الواقع المعزز</title>
  <!-- model-viewer: Web Component for 3D/AR -->
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; -webkit-text-size-adjust: 100%; }
    body { font-family: -apple-system, 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; direction: rtl; }
    .header { padding: 12px 16px; text-align: center; background: #1e293b; flex-shrink: 0; }
    .header h1 { font-size: 17px; font-weight: 600; }
    .header p { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .viewer-container { flex: 1; position: relative; min-height: 0; }
    model-viewer { width: 100%; height: 100%; --poster-color: #0f172a; }
    model-viewer::part(default-ar-button) { display: none; }
    .controls { padding: 12px 16px; background: #1e293b; display: flex; gap: 10px; justify-content: center; flex-shrink: 0;
      padding-bottom: max(12px, env(safe-area-inset-bottom)); }
    .controls button { padding: 12px 24px; border: none; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 500;
      font-family: inherit; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
    .btn-ar { background: #6366f1; color: #fff; }
    .btn-ar:active { background: #4f46e5; transform: scale(0.97); }
    .btn-capture { background: #334155; color: #fff; }
    .btn-capture:active { background: #475569; }
    .mode-badge { position: absolute; top: 12px; right: 12px; background: #6366f1; color: #fff; padding: 5px 12px;
      border-radius: 20px; font-size: 12px; z-index: 10; pointer-events: none; }
    .status { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.75);
      padding: 8px 18px; border-radius: 10px; font-size: 13px; opacity: 0; transition: opacity 0.3s; z-index: 10; pointer-events: none; }
    .status.visible { opacity: 1; }
    .no-model { display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8;
      flex-direction: column; gap: 12px; padding: 32px; text-align: center; }
    .no-model svg { width: 64px; height: 64px; opacity: 0.3; }
    @supports (padding: env(safe-area-inset-bottom)) {
      .controls { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${product.nameAr}</h1>
    <p>${product.nameEn} &mdash; ${product.sku}</p>
  </div>
  <div class="viewer-container">
    <span class="mode-badge">${viewerType === 'tryon' ? 'تجربة ارتداء' : 'وضع في المكان'}</span>
    ${hasModel ? `<model-viewer
      ${srcAttr}
      ${iosSrcAttr}
      alt="${product.nameAr}"
      ar
      ar-modes="${arModes}"
      ar-scale="auto"
      camera-controls
      touch-action="pan-y"
      auto-rotate
      rotation-per-second="20deg"
      shadow-intensity="1.2"
      environment-image="neutral"
      exposure="1"
      scale="${scale} ${scale} ${scale}"
      loading="eager"
      reveal="auto">
    </model-viewer>` : `<div class="no-model">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>
      <p>لم يتم رفع نموذج ثلاثي الأبعاد بعد.<br>ارفع ملف GLB أو USDZ من لوحة التحكم.</p>
    </div>`}
    <div class="status" id="status"></div>
  </div>
  <div class="controls">
    ${hasModel ? `<button class="btn-ar" id="arBtn">عرض بالواقع المعزز</button>` : ''}
    ${hasModel ? `<button class="btn-capture" id="captureBtn">التقاط صورة</button>` : ''}
  </div>
  <script>
    (function() {
      var BASE = "${baseUrl}";
      var companySlug = "${companySlug}";
      var sku = "${product.sku}";
      var viewerType = "${viewerType}";
      var sessionId = null;
      var mv = document.querySelector('model-viewer');

      // ---- Session tracking ----
      fetch(BASE + '/api/viewer/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companySlug: companySlug, sku: sku, viewerType: viewerType,
          device: { ua: navigator.userAgent, w: screen.width, h: screen.height, touch: 'ontouchstart' in window },
          referrer: document.referrer || null
        })
      }).then(function(r) { return r.json(); })
        .then(function(d) { if (d.success) sessionId = d.data.sessionId; })
        .catch(function() {});

      // End session
      function endSession() {
        if (!sessionId) return;
        var body = JSON.stringify({ sessionId: sessionId });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(BASE + '/api/viewer/session/end', new Blob([body], { type: 'application/json' }));
        }
      }
      window.addEventListener('pagehide', endSession);
      window.addEventListener('beforeunload', endSession);
      document.addEventListener('visibilitychange', function() { if (document.hidden) endSession(); });

      // ---- AR activation ----
      var arBtn = document.getElementById('arBtn');
      if (arBtn && mv) {
        arBtn.addEventListener('click', function() {
          if (mv.canActivateAR) {
            mv.activateAR();
          } else {
            showStatus('AR غير مدعوم على هذا الجهاز');
          }
        });
      }

      // ---- Screenshot ----
      var captureBtn = document.getElementById('captureBtn');
      if (captureBtn && mv) {
        captureBtn.addEventListener('click', function() {
          if (mv.toBlob) {
            mv.toBlob({ idealAspect: true }).then(function(blob) {
              var a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = sku + '-ar.png';
              a.click();
              URL.revokeObjectURL(a.href);
              showStatus('تم حفظ الصورة');
            });
          }
        });
      }

      // ---- Status toast ----
      function showStatus(msg) {
        var el = document.getElementById('status');
        el.textContent = msg;
        el.classList.add('visible');
        setTimeout(function() { el.classList.remove('visible'); }, 3000);
      }

      // Log AR activation
      if (mv) {
        mv.addEventListener('ar-status', function(e) {
          if (e.detail.status === 'session-started') showStatus('تم تشغيل الواقع المعزز');
        });
      }
    })();
  <\/script>
</body>
</html>`;
  }
}
