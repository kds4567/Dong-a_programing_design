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
  const query1 = 'SELECT * FROM kbo_team_rank ORDER BY winrate DESC';
  const query2 = 'SELECT * FROM kbo_player_rank ORDER BY num ASC LIMIT 10';
  const query3 = 'SELECT * FROM kbo_hitter_rank ORDER BY WAR DESC LIMIT 3';
  const query4 = 'SELECT * FROM kbo_hitter_rank ORDER BY AVG DESC LIMIT 3';
  const query5 = 'SELECT * FROM kbo_hitter_rank ORDER BY H DESC LIMIT 3';
  const query6 = 'SELECT * FROM kbo_hitter_rank ORDER BY HR DESC LIMIT 3';
  const query7 = 'SELECT * FROM kbo_hitter_rank ORDER BY OBP DESC LIMIT 3';
  const query8 = 'SELECT * FROM kbo_hitter_rank ORDER BY SLG DESC LIMIT 3';
  const query9 = 'SELECT * FROM kbo_pitcher_rank ORDER BY era ASC LIMIT 3';
  const query10 = 'SELECT * FROM kbo_pitcher_rank ORDER BY whip ASC LIMIT 3';
  const query11 = 'SELECT * FROM kbo_pitcher_rank ORDER BY so DESC LIMIT 3';
  const query12 = 'SELECT * FROM kbo_pitcher_rank ORDER BY win DESC LIMIT 3';
  const query13 = 'SELECT * FROM kbo_pitcher_rank ORDER BY hold DESC LIMIT 3'; 
  const query14 = 'SELECT * FROM kbo_pitcher_rank ORDER BY save DESC LIMIT 3';


  // 각 쿼리를 Promise로 실행
  const query1Promise = new Promise((resolve, reject) => {
    connection.query(query1, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  const query2Promise = new Promise((resolve, reject) => {
    connection.query(query2, (err, results2) => {
      if (err) reject(err);
      else resolve(results2);
    });
  });

  const query3Promise = new Promise((resolve, reject) => {
    connection.query(query3, (err, results3) => {
      if (err) reject(err);
      else resolve(results3);
    });
  });
  const query4Promise = new Promise((resolve, reject) => {
    connection.query(query4, (err, results4) => {
      if (err) reject(err);
      else resolve(results4);
    });
  });
  const query5Promise = new Promise((resolve, reject) => {
    connection.query(query5, (err, results5) => {
      if (err) reject(err);
      else resolve(results5);
    });
  });
  const query6Promise = new Promise((resolve, reject) => {
    connection.query(query6, (err, results6) => {
      if (err) reject(err);
      else resolve(results6);
    });
  });
  const query7Promise = new Promise((resolve, reject) => {
    connection.query(query7, (err, results7) => {
      if (err) reject(err);
      else resolve(results7);
    });
  });
  const query8Promise = new Promise((resolve, reject) => {
    connection.query(query8, (err, results8) => {
      if (err) reject(err);
      else resolve(results8);
    });
  });
  const query9Promise = new Promise((resolve, reject) => {
    connection.query(query9, (err, results9) => {
      if (err) reject(err);
      else resolve(results9);
    });
  });
  const query10Promise = new Promise((resolve, reject) => {
    connection.query(query10, (err, results10) => {
      if (err) reject(err);
      else resolve(results10);
    });
  });
  const query11Promise = new Promise((resolve, reject) => {
    connection.query(query11, (err, results11) => {
      if (err) reject(err);
      else resolve(results11);
    });
  });
  const query12Promise = new Promise((resolve, reject) => {
    connection.query(query12, (err, results12) => {
      if (err) reject(err);
      else resolve(results12);
    });
  });
  const query13Promise = new Promise((resolve, reject) => {
    connection.query(query13, (err, results13) => {
      if (err) reject(err);
      else resolve(results13);
    });
  });
  const query14Promise = new Promise((resolve, reject) => {
    connection.query(query14, (err, results14) => {
      if (err) reject(err);
      else resolve(results14);
    });
  });

  // 모든 쿼리 실행 완료 후 결과 처리
  Promise.all([query1Promise, query2Promise, query3Promise, query4Promise, query5Promise, query6Promise, query7Promise, query8Promise, query9Promise, query10Promise, query11Promise, query12Promise, query13Promise, query14Promise])
    .then(([results, results2, results3, results4, results5, results6, results7, results8, results9, results10, results11, results12, results13, results14]) => {
      res.render('test', { data: results, data2: results2, data3: results3, data4: results4, data5: results5, data6: results6, data7: results7, data8: results8, data9: results9, data10: results10, data11: results11, data12: results12, data13: results13, data14: results14});
    })
    .catch(err => {
      console.error('Error executing query:', err.stack);
      res.status(500).send('Error executing query');
    });
});



// 서버 시작
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
