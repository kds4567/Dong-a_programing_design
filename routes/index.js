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

// home 페이지
router.get('/', async (req, res) => {
        if (req.session.user) {
                res.render('home', { user : req.session.user });
        } else {
                res.render('home', {user : null}); // 로그인하지 않은 경우
        }
});


// login 페이지
router.get('/login', async (req, res) => {
        res.render('login',);

});

// 로그인 처리
router.post('/login', (req, res) => {
        const { username, password } = req.body;

        // 데이터베이스에서 사용자 정보 조회
        connection.query(
            'SELECT * FROM user WHERE Username = ? AND Password = ?',
            [username, password],
            (err, results) => {
                    if (err) {
                            console.error(err);
                            return res.status(500).send('서버 오류가 발생했습니다.');
                    }
                    if (results.length > 0) {
                            req.session.user = results[0]; // 세션에 사용자  저장
                            console.log(req.session.user);
                            res.redirect('/'); // 로그인 성공 후 홈 페이지로 리다이렉트
                    } else {
                            res.send('로그인 실패! <a href="/login">다시 시도</a>');
                    }
            }
        );
});

// register 페이지
router.get('/register', async (req, res) => {
        res.render('register',);

});

// 회원가입 처리
router.post('/register', (req, res) => {
    const { username, password, name } = req.body;
    const currentDate = new Date(); // 현재 시각

    // 사용자 정보 저장
    connection.query(
        'INSERT INTO user (Username, Password, Name, created) VALUES (?, ?, ?, ?)',
        [username, password, name, currentDate], // 현재 시각을 배열에 추가
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('회원가입 실패!<a href="/register">회원가입하기</a>');
            }
            res.send('회원가입 성공! <a href="/login">로그인하기</a>');
        }
    );
});


// 로그아웃 처리
router.get('/logout', (req, res) => {
        req.session.destroy(err => {
                if (err) {
                        return res.send('로그아웃 실패!');
                }
                res.redirect('/');
        });
});

// 세션 상태 확인
router.get('/profile', (req, res) => {
        if (req.session.user) {
                res.send(`안녕하세요, ${req.session.user.username}! <a href="/logout">Logout</a>`);
        } else {
                res.send('로그인 해주세요! <a href="/login">Login</a>');
        }
});


module.exports = router;