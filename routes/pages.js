const express = require('express');
const router = express.Router();

// 검색 페이지 라우트
router.get('/search', (req, res) => {
    res.render('search'); // 'views/search.ejs' 렌더링
});

// FAQ 페이지 라우트
router.get('/faq', (req, res) => {
    res.render('faq'); // 'views/faq.ejs' 렌더링
});

// 가이드 페이지 라우트
router.get('/guide', (req, res) => {
    res.render('guide'); // 'views/guide.ejs' 렌더링
});

module.exports = router;
