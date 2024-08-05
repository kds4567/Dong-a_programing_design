const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const port = 3000;

// MySQL 연결 설정
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

// 정적 파일 제공 설정
app.use(express.static('public'));  // public 디렉토리에서 정적 파일을 제공

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', './views');  // 뷰 파일이 위치한 디렉토리 설정 (기본값: 'views')

// 기본 라우트 설정
app.get('/', (req, res) => {
  const query = 'SELECT * FROM kbo_team_rank';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err.stack);
      res.status(500).send('Error executing query');
      return;
    }
    res.render('test', { data: results });  // 쿼리 결과를 템플릿으로 전달
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
