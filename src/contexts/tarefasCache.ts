export const LEGADO_KEY = 'ctoperacional:tarefas';
export const cacheKey = (dono: string) => `ctoperacional:cache:${dono}`;

export const limparCacheTarefas = (dono = 'anon') => {
  try {
    localStorage.removeItem(cacheKey(dono));
    localStorage.removeItem(LEGADO_KEY);
  } catch {
    /* ignore */
  }
};
