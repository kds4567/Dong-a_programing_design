// app.js

const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
require("dotenv").config();
const app = express();
const PORT = process.env.PORT; // 환경변수에서 포트 가져오기

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
  console.log('Connected to MySQL');
});

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', './views');  // 뷰 파일이 위치한 디렉토리 설정 (기본값: 'views')

// 정적 파일 제공 설정
app.use(express.static('public'));  // public 디렉토리에서 정적 파일을 제공

// 세션 설정
app.use(session({
  secret: 'your_secret_key', // 세션 암호화 키
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // HTTPS 사용 시 true로 설정
}));

// 기본 라우트 설정
app.use((req, res, next) => {
  req.db = connection; // MySQL 연결을 모든 요청에 추가
  next();
});

app.use('/', require('./routes/home'));
app.use('/login', require('./routes/login'));
app.use('/logout', require('./routes/logout'));
app.use('/register', require('./routes/register'));

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});