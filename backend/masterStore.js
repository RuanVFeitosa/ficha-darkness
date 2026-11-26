const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const profile = row => ({ id: row.id, nome: row.nome, papel: 'mestre' });
const query = params => '?' + new URLSearchParams(params);

function createMasterStore(dataDir, remote) {
  const directory = path.join(dataDir, 'mestres');
  const fileFor = hash => path.join(directory, hash + '.json');

  return {
    async find(hash) {
      if (remote) {
        const [row] = await remote(query({ select: 'id,nome', codigo_hash: 'eq.' + hash }));
        return row ? profile(row) : null;
      }
      try {
        return profile(JSON.parse(await fs.readFile(fileFor(hash), 'utf8')));
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
    },
    async create(nome, hash) {
      const mestre = { id: randomUUID(), nome };
      if (remote) {
        const [row] = await remote(query({ on_conflict: 'codigo_hash', select: 'id,nome' }), {
          method: 'POST',
          headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
          body: JSON.stringify({ ...mestre, codigo_hash: hash }),
        });
        return row ? profile(row) : null;
      }
      await fs.mkdir(directory, { recursive: true });
      const temporary = path.join(directory, mestre.id + '.tmp');
      await fs.writeFile(temporary, JSON.stringify({ ...mestre, criado_em: new Date().toISOString() }), { flag: 'wx' });
      try {
        await fs.link(temporary, fileFor(hash));
        return profile(mestre);
      } catch (error) {
        if (error.code === 'EEXIST') return null;
        throw error;
      } finally {
        await fs.unlink(temporary).catch(error => {
          if (error.code !== 'ENOENT') console.warn('Falha ao limpar cadastro temporário:', error.code);
        });
      }
    },
    async list(offset, limit) {
      if (remote) {
        const rows = await remote(query({ select: 'id,nome', order: 'criado_em.desc,id.asc', offset, limit }));
        return rows.map(profile);
      }
      await fs.mkdir(directory, { recursive: true });
      const files = (await fs.readdir(directory)).filter(file => /^[a-f0-9]{64}\.json$/.test(file));
      const rows = await Promise.all(files.map(async file => JSON.parse(await fs.readFile(path.join(directory, file), 'utf8'))));
      rows.sort((a, b) => b.criado_em.localeCompare(a.criado_em) || a.id.localeCompare(b.id));
      return rows.slice(offset, offset + limit).map(profile);
    },
  };
}

module.exports = { createMasterStore };
