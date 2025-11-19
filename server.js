const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Configurações de limite para aceitar fotos grandes
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da Sessão
app.use(session({
    secret: 'keywordpalavrachave',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Autenticação
const verificarAutenticacao = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado. Faça login novamente.' });
    }
};

// Banco de dados SQLite
const db = new sqlite3.Database('./dados.db', (err) => {
    if (err) console.error(err.message);
    else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT UNIQUE, senha TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS pontos (id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT, lat REAL, lng REAL, titulo TEXT, descricao TEXT, foto TEXT)`);
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Cadastro
app.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        db.run(`INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`, [nome, email, hashedPassword], function(err) {
            if (err) return res.status(400).json({ message: 'E-mail já existe.' });
            res.status(201).json({ message: 'Sucesso!' });
        });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

// Login
app.post('/login', (req, res) => {
    const { email, senha, lembrar } = req.body;

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(401).json({ message: 'E-mail ou senha inválidos.' });

        const match = await bcrypt.compare(senha, user.senha);
        if (!match) return res.status(401).json({ message: 'E-mail ou senha inválidos.' });

        req.session.user = { id: user.id, username: user.nome, email: user.email };

        if (lembrar) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Login dura por 30 dias
        } else {
            req.session.cookie.expires = false; // Login dura até fechar o navegador
        }

        res.status(200).json({ message: 'Login ok!', user: req.session.user });
    });
});

app.get('/pontos', verificarAutenticacao, (req, res) => {
    db.all(`SELECT * FROM pontos`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`Enviando ${rows.length} pontos.`);
        res.json(rows);
    });
});

app.post('/pontos', verificarAutenticacao, (req, res) => {
    const { tipo, lat, lng, titulo, descricao, foto } = req.body;
    db.run(`INSERT INTO pontos (tipo, lat, lng, titulo, descricao, foto) VALUES (?, ?, ?, ?, ?, ?)`, 
        [tipo, lat, lng, titulo, descricao, foto], function(err) {
        if (err) return res.status(500).json({ sucesso: false });
        console.log(`Ponto salvo! ID: ${this.lastID}`);
        res.json({ sucesso: true, id: this.lastID });
    });
});

app.delete('/pontos/:id', verificarAutenticacao, (req, res) => {
    db.run(`DELETE FROM pontos WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ sucesso: false });
        console.log(`Ponto deletado.`);
        res.json({ sucesso: true });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});