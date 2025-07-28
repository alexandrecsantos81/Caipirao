const jwt = require('jsonwebtoken');
require('dotenv').config();


function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrai o token do cabeçalho "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ error: "Acesso negado. Nenhum token fornecido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido ou expirado." });
        }
        req.user = user; // Adiciona os dados do utilizador (payload) à requisição
        next(); // O token é válido, a requisição pode prosseguir para a rota final.
    });
}


function checkAdmin(req, res, next) {
    // O middleware 'verifyToken' já deve ter sido executado e colocado o 'user' no 'req'
    if (req.user && req.user.perfil === 'ADMIN') {
        next(); // O utilizador é ADMIN, pode prosseguir
    } else {
        // Se não for ADMIN, retorna erro de "Acesso Proibido"
        res.status(403).json({ error: "Acesso negado. Requer perfil de Administrador." });
    }
}

module.exports = {
    verifyToken,
    checkAdmin
};