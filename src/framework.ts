import * as http from 'http';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface HttpRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  params: Record<string, string>;
  body?: any;
  rawBody?: string;
}

export interface HttpResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  json(obj: any): void;
  send(body: any): void;
  status(code: number): HttpResponse;
}

export type Middleware = (req: HttpRequest, res: HttpResponse, next: () => void) => void | Promise<void>;

// Simple router with path params like /users/:id
export class Router {
  private routes: Array<{ method: HttpMethod; path: string; handler: Middleware }> = [];

  on(method: string, path: string, handler: Middleware) {
    this.routes.push({ method: method.toUpperCase() as HttpMethod, path, handler });
  }

  match(method: string, actualPath: string): { handler: Middleware; params: Record<string, string> } | null {
    const m = method.toUpperCase() as HttpMethod;
    for (const r of this.routes) {
      if (r.method !== m) continue;
      const params = this.matchPath(r.path, actualPath);
      if (params) return { handler: r.handler, params };
    }
    return null;
  }

  private matchPath(routePath: string, actualPath: string): Record<string, string> | null {
    const rp = routePath.split('/').filter(Boolean);
    const ap = actualPath.split('/').filter(Boolean);
    if (rp.length !== ap.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < rp.length; i++) {
      const rPart = rp[i];
      const aPart = ap[i];
      if (rPart.startsWith(':')) {
        const name = rPart.slice(1);
        params[name] = decodeURIComponent(aPart);
      } else if (rPart === aPart) {
        // exact match, continue
      } else {
        return null;
      }
    }
    return Object.keys(params).length ? params : {};
  }
}

class HttpResponseImpl implements HttpResponse {
  statusCode: number = 200;
  private _headers: Record<string, string> = {};
  constructor(private readonly res: http.ServerResponse) {}
  setHeader(name: string, value: string) {
    this._headers[name] = value;
    this.res.setHeader(name, value);
  }
  json(obj: any) {
    this.setHeader('Content-Type', 'application/json');
    this.res.writeHead(this.statusCode, this._headers);
    this.res.end(JSON.stringify(obj));
  }
  send(body: any) {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    this.res.writeHead(this.statusCode, this._headers);
    this.res.end(data);
  }
  status(code: number): HttpResponse {
    this.statusCode = code;
    return this;
  }
}

export class App {
  private router = new Router();
  private globalMiddlewares: Middleware[] = [];

  use(mw: Middleware): this {
    this.globalMiddlewares.push(mw);
    return this;
  }

  // path-prefix middleware
  usePath(prefix: string, mw: Middleware): this {
    this.globalMiddlewares.push((req, res, next) => {
      if (req.path.startsWith(prefix)) {
        return mw(req, res, next);
      } else {
        next();
      }
    });
    return this;
  }

  get(path: string, handler: Middleware): this {
    this.router.on('GET', path, handler);
    return this;
  }
  post(path: string, handler: Middleware): this {
    this.router.on('POST', path, handler);
    return this;
  }
  put(path: string, handler: Middleware): this {
    this.router.on('PUT', path, handler);
    return this;
  }
  delete(path: string, handler: Middleware): this {
    this.router.on('DELETE', path, handler);
    return this;
  }

  listen(port: number, host?: string) {
    const server = http.createServer((nodeReq, nodeRes) => {
      const method = (nodeReq.method || 'GET').toString();
      const urlPath = nodeReq.url || '/';
      let path = urlPath;
      let query: Record<string, string> = {};
      try {
        const url = new URL(urlPath, 'http://localhost');
        path = url.pathname;
        url.searchParams.forEach((v, k) => {
          query[k] = v;
        });
      } catch {
        // fallback
        path = urlPath;
      }

      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(nodeReq.headers || {})) {
        if (Array.isArray(v)) headers[k] = v.join(','); else if (typeof v === 'string') headers[k] = v;
      }

      const reqObj: HttpRequest = { method, path, headers, query, params: {}, body: undefined, rawBody: '' };
      const resObj: HttpResponse = new HttpResponseImpl(nodeRes);

      // read body
      let raw = '';
      nodeReq.on('data', chunk => {
        raw += typeof chunk === 'string' ? chunk : chunk.toString();
      });
      nodeReq.on('end', () => {
        if (raw) {
          reqObj.rawBody = raw;
          try { reqObj.body = JSON.parse(raw); } catch { reqObj.body = raw; }
        }

        const m = this.router.match(method, path);
        const chain: Middleware[] = [...this.globalMiddlewares];
        if (m) {
          reqObj.params = m.params || {};
          chain.push(m.handler);
        } else {
          chain.push((rq, rs, nx) => { rs.status(404).send({ error: 'Not Found' }); });
        }

        let idx = 0;
        const next = () => {
          const fn = chain[idx++];
          if (!fn) return;
          try {
            const result = fn(reqObj, resObj, next);
            if (result && typeof (result as any).then === 'function') {
              (result as Promise<void>).then(() => {}).catch(() => {
                (resObj as HttpResponseImpl).status(500).json({ error: 'Internal Server Error' });
              });
            }
          } catch {
            (resObj as HttpResponseImpl).status(500).json({ error: 'Internal Server Error' });
          }
        };
        next();
      });

    });

    server.listen(port, host);
    return server;
  }
}
