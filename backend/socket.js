const parties = {};

function criarPartyCode() {
  return `PARTY-${Math.floor(1000 + Math.random() * 9000)}`;
}

function iniciarSocket(io) {
  io.on("connection", (socket) => {
    console.log("Jogador conectado:", socket.id);

    socket.on("create-party", ({ fichaId, personagem }) => {
      const partyCode = criarPartyCode();

      parties[partyCode] = {
        code: partyCode,
        players: {},
        notes: [],
        rolls: [],
        itemTransfers: [],
      };

      socket.join(partyCode);

      parties[partyCode].players[fichaId] = {
        socketId: socket.id,
        fichaId,
        personagem,
      };

      io.to(partyCode).emit("party-updated", parties[partyCode]);
      socket.emit("party-created", { partyCode });
    });

    socket.on("join-party", ({ partyCode, fichaId, personagem }) => {
      if (!parties[partyCode]) {
        socket.emit("party-error", "Party não encontrada.");
        return;
      }

      socket.join(partyCode);

      parties[partyCode].players[fichaId] = {
        socketId: socket.id,
        fichaId,
        personagem,
      };

      io.to(partyCode).emit("party-updated", parties[partyCode]);
    });

    socket.on("update-player-status", ({ partyCode, fichaId, personagem }) => {
      if (!parties[partyCode]?.players?.[fichaId]) return;

      parties[partyCode].players[fichaId].personagem = personagem;

      io.to(partyCode).emit("party-updated", parties[partyCode]);
    });

    socket.on("send-party-note", ({ partyCode, note }) => {
      if (!parties[partyCode]) return;

      const novaNota = {
        id: Date.now(),
        ...note,
      };

      parties[partyCode].notes.unshift(novaNota);

      io.to(partyCode).emit("party-updated", parties[partyCode]);
    });

    socket.on("send-roll", ({ partyCode, roll }) => {
      if (!parties[partyCode]) return;

      const novaRolagem = {
        id: Date.now(),
        ...roll,
      };

      parties[partyCode].rolls.unshift(novaRolagem);

      io.to(partyCode).emit("party-updated", parties[partyCode]);
    });

    socket.on("disconnect", () => {
      Object.values(parties).forEach((party) => {
        Object.entries(party.players).forEach(([fichaId, player]) => {
          if (player.socketId === socket.id) {
            delete party.players[fichaId];
            io.to(party.code).emit("party-updated", party);
          }
        });
      });
    });
  });
}

module.exports = {
  iniciarSocket,
};