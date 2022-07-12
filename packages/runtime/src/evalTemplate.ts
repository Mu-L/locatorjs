export function evalTemplate(str: string, params: { [key: string]: string }) {
  const names = Object.keys(params);
  const vals = Object.values(params);

  return new Function(...names, `return \`${str}\`;`)(...vals);
}
