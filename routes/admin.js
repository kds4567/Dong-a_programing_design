const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

// MySQL 연결 설정
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

//세션 설정
router.use(session({
    secret: 'your_secret_key', // 세션 암호화 키
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS 사용 시 true로 설정
}));

// 유저 목록 페이지
router.get('/user', async (req, res) => {
    connection.query('SELECT * FROM user', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('서버 오류가 발생했습니다.');
        }
        res.render('user', { user: results });
    });
});

// 사용자 수정 페이지
router.get('/user/edit/:id', (req, res) => {
    const userId = req.params.id;
    connection.query('SELECT * FROM user WHERE Id = ?', [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('서버 오류가 발생했습니다.');
        }
        if (results.length > 0) {
            res.render('editUser', { user: results[0] });
        } else {
            res.status(404).send('사용자를 찾을 수 없습니다.');
        }
    });
});

// 사용자 수정 처리
router.post('/user/edit/:id', (req, res) => {
    const userId = req.params.id;
    const { username, password, name } = req.body;

    connection.query(
        'UPDATE user SET Username = ?, Password = ?, Name = ? WHERE Id = ?',
        [username, password, name, userId],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('서버 오류가 발생했습니다.');
            }
            res.redirect('/user'); // 수정 후 사용자 목록으로 리다이렉트
        }
    );
});

// 사용자 삭제 처리
router.post('/user/delete/:id', (req, res) => {
    const userId = req.params.id;
    connection.query('DELETE FROM user WHERE Id = ?', [userId], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('서버 오류가 발생했습니다.');
        }
        res.redirect('/user'); // 삭제 후 사용자 목록으로 리다이렉트
    });
});

router.get('/repo', (req, res) => {
    res.render('repo');
})

router.get('/commit', (req, res) => {
    res.render('commit');
})

module.exports = router;