const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

// login 페이지
router.get('/', (req, res) => {
    res.render('login');
});

// 로그인 처리
router.post('/', (req, res) => {
    const { username, password } = req.body;
    req.db.query(
        'SELECT * FROM user WHERE Username = ? AND Password = ?',
        [username, password],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('서버 오류가 발생했습니다.');
            }
            if (results.length > 0) {
                req.session.user = results[0];
                res.redirect('/'); // 로그인 성공 후 홈 페이지로 리다이렉트
            } else {
                res.send('로그인 실패! <a href="/login">다시 시도</a>');
            }
        }
    );
});

module.exports = router;