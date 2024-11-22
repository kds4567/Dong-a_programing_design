const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

// 로그아웃 처리
router.get('/', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send('로그아웃 실패!');
        }
        res.redirect('/');
    });
});


module.exports = router;