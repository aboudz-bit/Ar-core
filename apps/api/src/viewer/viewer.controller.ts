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

      // Return viewer HTML
      const config = product.configs[0];
      const glbAsset = product.assets.find((a) => a.type === 'placement_glb' || a.type === 'tryon_glb');

      const html = this.generateViewerHtml(product, config, glbAsset, companySlug);
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

  // Embed.js
  @Get('embed.js')
  async embedScript(@Res() res: Response) {
    const apiUrl = process.env.API_URL || 'http://localhost:4000';

    const js = `(function(){
  var API_URL = "${apiUrl}";

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
    res.send(js);
  }

  private generateViewerHtml(product: any, config: any, glbAsset: any, companySlug: string): string {
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    const assetUrl = glbAsset ? `${apiUrl}/uploads/${glbAsset.path}` : '';
    const viewerType = config?.viewerType || 'placement';
    const scale = config?.scale || 1;

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.nameAr} - عارض الواقع المعزز</title>
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #fff; height: 100vh; display: flex; flex-direction: column; direction: rtl; }
    .header { padding: 16px; text-align: center; background: #1e293b; }
    .header h1 { font-size: 18px; font-weight: 600; }
    .header p { font-size: 13px; color: #94a3b8; margin-top: 4px; }
    .viewer-container { flex: 1; position: relative; }
    model-viewer { width: 100%; height: 100%; }
    .controls { padding: 16px; background: #1e293b; display: flex; gap: 12px; justify-content: center; }
    .controls button { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-family: inherit; transition: all 0.2s; }
    .btn-ar { background: #6366f1; color: #fff; }
    .btn-ar:hover { background: #4f46e5; }
    .btn-capture { background: #334155; color: #fff; }
    .btn-capture:hover { background: #475569; }
    .mode-badge { position: absolute; top: 16px; right: 16px; background: #6366f1; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 13px; z-index: 10; }
    .status { position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); padding: 8px 16px; border-radius: 8px; font-size: 13px; display: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${product.nameAr}</h1>
    <p>SKU: ${product.sku}</p>
  </div>
  <div class="viewer-container">
    <span class="mode-badge">${viewerType === 'tryon' ? 'تجربة ارتداء' : 'وضع في المكان'}</span>
    ${assetUrl ? `<model-viewer
      src="${assetUrl}"
      alt="${product.nameAr}"
      ar
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      touch-action="pan-y"
      auto-rotate
      shadow-intensity="1"
      scale="${scale} ${scale} ${scale}"
      style="width:100%;height:100%;">
      <button slot="ar-button" style="background:#6366f1;color:#fff;border:none;padding:10px 20px;border-radius:8px;position:absolute;bottom:16px;left:50%;transform:translateX(-50%);">
        عرض في مكانك
      </button>
    </model-viewer>` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;">لا يوجد نموذج ثلاثي الأبعاد</div>'}
    <div class="status" id="status"></div>
  </div>
  <div class="controls">
    <button class="btn-ar" onclick="activateAR()">📱 عرض بالواقع المعزز</button>
    <button class="btn-capture" onclick="capture()">📸 التقاط صورة</button>
  </div>
  <script>
    var API_URL = "${apiUrl}";
    var companySlug = "${companySlug}";
    var sku = "${product.sku}";
    var sessionId = null;

    // Start session
    fetch(API_URL + '/api/viewer/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companySlug: companySlug,
        sku: sku,
        viewerType: '${viewerType}',
        device: { userAgent: navigator.userAgent, screen: screen.width + 'x' + screen.height },
        referrer: document.referrer
      })
    }).then(r => r.json()).then(d => { if (d.success) sessionId = d.data.sessionId; });

    // End session on unload
    window.addEventListener('beforeunload', function() {
      if (sessionId) {
        navigator.sendBeacon(API_URL + '/api/viewer/session/end', JSON.stringify({ sessionId: sessionId }));
      }
    });

    function activateAR() {
      var mv = document.querySelector('model-viewer');
      if (mv && mv.canActivateAR) { mv.activateAR(); }
      showStatus('جاري تشغيل الواقع المعزز...');
    }

    function capture() {
      var mv = document.querySelector('model-viewer');
      if (mv) {
        var blob = mv.toBlob && mv.toBlob();
        showStatus('تم التقاط الصورة');
      }
    }

    function showStatus(msg) {
      var el = document.getElementById('status');
      el.textContent = msg;
      el.style.display = 'block';
      setTimeout(function() { el.style.display = 'none'; }, 3000);
    }
  </script>
</body>
</html>`;
  }
}
