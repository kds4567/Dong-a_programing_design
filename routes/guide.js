const express = require('express');
const router = express.Router();

// /guide 경로 처리
router.get('/', (req, res) => {
    res.render('guide'); // views/guide.ejs를 렌더링
});


module.exports = router;