#!/usr/bin/env node

/**
 * ModelFlow API Server
 * 提供图形化界面所需的后端 API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const ROOT_DIR = path.join(__dirname, '..');
const UI_DIR = path.join(__dirname, 'ui');

const { routeMessage, getRouterStatus, handleSwitch } = require('../integrate');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function sendFile(res, filepath, contentType) {
  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

async function handleAPI(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  try {
    if (pathname === '/api/status' && method === 'GET') {
      const status = getRouterStatus();
      sendJSON(res, { success: true, data: status });
    }
    else if (pathname === '/api/switch' && method === 'POST') {
      const body = await parseBody(req);
      const result = handleSwitch('/switch ' + body.command);
      sendJSON(res, { success: result.success, message: result.message, state: result.state });
    }
    else if (pathname === '/api/route' && method === 'POST') {
      const body = await parseBody(req);
      const result = routeMessage(body.message);
      sendJSON(res, { success: true, data: result });
    }
    else if (pathname === '/api/test' && method === 'POST') {
      const body = await parseBody(req);
      const result = routeMessage(body.message);
      sendJSON(res, { success: true, data: result });
    }
    else {
      sendJSON(res, { success: false, error: 'Unknown endpoint' }, 404);
    }
  } catch (err) {
    console.error('API Error:', err);
    sendJSON(res, { success: false, error: err.message }, 500);
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);

  if (pathname.startsWith('/api/')) {
    await handleAPI(req, res);
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    sendFile(res, path.join(UI_DIR, 'index.html'), 'text/html');
    return;
  }

  const filePath = path.join(UI_DIR, pathname);
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  if (fs.existsSync(filePath)) {
    sendFile(res, filePath, contentTypes[ext] || 'application/octet-stream');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`
================================
  ModelFlow API Server
================================

服务已启动: http://localhost:${PORT}

API 端点:
  GET  /api/status     - 获取路由器状态
  POST /api/switch     - Switch 命令
  POST /api/route      - 路由消息
  POST /api/test       - 测试路由

图形界面:
  http://localhost:${PORT}/

按 Ctrl+C 停止服务
================================
  `);
});
