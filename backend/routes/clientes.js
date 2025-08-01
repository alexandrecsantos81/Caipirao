// Use a sintaxe require para importar os módulos
const express = require("express");
// Linha corrigida
const db = require("../db.js");

const router = express.Router();

// ROTA GET - Listar todos os clientes
router.get("/", (_, res) => {
  const q = "SELECT * FROM clientes ORDER BY nome ASC";

  db.query(q, (err, data) => {
    // 1. Verificação de erro primeiro
    if (err) {
      // Loga o erro detalhado no console do *backend* para depuração
      console.error("ERRO AO BUSCAR CLIENTES NO BANCO DE DADOS:", err);
      return res.status(500).json({ message: "Erro interno do servidor ao consultar o banco de dados." });
    }

    // 2. Verificação da resposta
    // Garante que estamos retornando um array, mesmo que data.rows não exista ou esteja vazio.
    // Se data.rows existir, usa ele. Senão, retorna um array vazio para o frontend.
    const clientes = data && data.rows ? data.rows : [];
    
    return res.status(200).json(clientes);
  });
});

// ROTA POST - Criar um novo cliente
router.post("/", (req, res) => {
  const q =
    "INSERT INTO clientes(nome, contato, nome_responsavel, telefone_whatsapp, logradouro, quadra, lote, bairro, cep, ponto_referencia) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
  const values = [
    req.body.nome, req.body.contato, req.body.nome_responsavel,
    req.body.telefone_whatsapp, req.body.logradouro, req.body.quadra,
    req.body.lote, req.body.bairro, req.body.cep, req.body.ponto_referencia,
  ];
  db.query(q, values, (err) => {
    if (err) {
      console.error("Erro na rota POST /clientes:", err);
      return res.status(500).json("Ocorreu um erro ao cadastrar o cliente.");
    }
    return res.status(201).json("Cliente cadastrado com sucesso.");
  });
});

// ROTA PUT - Atualizar um cliente existente
router.put("/:id", (req, res) => {
  const q =
    "UPDATE clientes SET nome = $1, contato = $2, nome_responsavel = $3, telefone_whatsapp = $4, logradouro = $5, quadra = $6, lote = $7, bairro = $8, cep = $9, ponto_referencia = $10 WHERE id = $11";
  const values = [
    req.body.nome, req.body.contato, req.body.nome_responsavel,
    req.body.telefone_whatsapp, req.body.logradouro, req.body.quadra,
    req.body.lote, req.body.bairro, req.body.cep, req.body.ponto_referencia,
    req.params.id,
  ];
  db.query(q, values, (err) => {
    if (err) {
      console.error("Erro na rota PUT /clientes:", err);
      return res.status(500).json("Ocorreu um erro ao atualizar o cliente.");
    }
    return res.status(200).json("Cliente atualizado com sucesso.");
  });
});

// ROTA DELETE - Deletar um cliente
router.delete("/:id", (req, res) => {
  const q = "DELETE FROM clientes WHERE id = $1";
  db.query(q, [req.params.id], (err) => {
    if (err) {
      console.error("Erro na rota DELETE /clientes:", err);
      return res.status(500).json("Ocorreu um erro ao deletar o cliente.");
    }
    return res.status(200).json("Cliente deletado com sucesso.");
  });
});

// Use module.exports para exportar o router
module.exports = router;
