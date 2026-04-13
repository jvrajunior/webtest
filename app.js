const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const _ = require('lodash'); // Biblioteca vulnerável
const app = express();
const port = 3000;

// VULNERABILIDADE: Hardcoded Secret (Secret Scanning)
const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7VPWN92R";
const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzRg8dHqVs2";

const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run("CREATE TABLE users (id INT, name TEXT)");
  db.run("INSERT INTO users VALUES (1, 'Admin')");
});

app.get('/', (req, res) => {
  res.send('<h1>App Vulnerável para Testes de CI/CD</h1>');
});

// VULNERABILIDADE: SQL Injection (SAST)
app.get('/user', (req, res) => {
  const id = req.query.id;
  // O input do usuário é concatenado diretamente na query
  const query = `SELECT * FROM users WHERE id = ${id}`;
  
  db.get(query, (err, row) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(row);
    }
  });
});

// VULNERABILIDADE: Reflected XSS (SAST)
app.get('/hello', (req, res) => {
  const name = req.query.name;
  // O input é renderizado sem sanitização
  res.send(`<html><body><h1>Olá, ${name}</h1></body></html>`);
});

// VULNERABILIDADE: Uso de função insegura do lodash (SCA/SAST)
app.get('/merge', (req, res) => {
    let obj = {};
    let payload = JSON.parse(req.query.data);
    // _.merge em versões antigas é vulnerável a Prototype Pollution
    _.merge(obj, payload);
    res.json(obj);
});

// VULNERABILIDADE CRÍTICA: Command Injection (SAST)
const { exec } = require('child_process');
app.get('/ping', (req, res) => {
  const host = req.query.host;
  // O input do usuário é passado diretamente ao shell sem sanitização
  exec(`ping -c 1 ${host}`, (err, stdout, stderr) => {
    if (err) {
      res.status(500).send(stderr);
    } else {
      res.send(`<pre>${stdout}</pre>`);
    }
  });
});

app.listen(port, () => {
  console.log(`App rodando em http://localhost:${port}`);
});