// @ts-ignore
import handler from '../dist/server.cjs';

export default async function (req: any, res: any) {
  const actualHandler = typeof handler === 'function' ? handler : (handler as any).default;
  return actualHandler(req, res);
}

