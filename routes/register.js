const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

// register 페이지
router.get('/', (req, res) => {
    res.render('register');
});

// 회원가입 처리
router.post('/', (req, res) => {
    const { username, password, name } = req.body;
    const currentDate = new Date();

    req.db.query(
        'INSERT INTO user (Username, Password, Name, created) VALUES (?, ?, ?, ?)',
        [username, password, name, currentDate],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('회원가입 실패!<a href="/register">회원가입하기</a>');
            }
            res.send('회원가입 성공! <a href="/login">로그인하기</a>');
        }
    );
});

module.exports = router;