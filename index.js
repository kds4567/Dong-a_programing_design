const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const port = 3000;

// MySQL ���� ����
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

// EJS ���ø� ���� ����
app.set('view engine', 'ejs');
app.set('views', './views');  // �� ������ ��ġ�� ���丮 ���� (�⺻��: 'views')

// �⺻ ���Ʈ ����
app.get('/', (req, res) => {
  res.render('test'); // views/index.ejs ������ ������
});

// ���� ����
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
