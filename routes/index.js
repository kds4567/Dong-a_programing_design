const express = require('express');
const router = express.Router();

// 홈 페이지 라우트
router.get('/', (req, res) => {
  res.render('index'); // views/index.ejs를 렌더링
});

// 검색 페이지 라우트
router.get('/search', (req, res) => {
  res.send('검색 페이지입니다.');
});

// 게시물 공유 페이지 라우트
router.get('/share', (req, res) => {
  res.send('게시물 공유 페이지입니다.');
});

// 가이드 페이지 라우트
router.get('/guide', (req, res) => {
  res.send('가이드 페이지입니다.');
});

// Repository 1 페이지
router.get('/repository1', (req, res) => {
    res.render('repository1', { repositoryName: 'Repository 1' });
});

// Repository 2 페이지
router.get('/repository2', (req, res) => {
    res.render('repository2', { repositoryName: 'Repository 2' });
});

// Repository 3 페이지
router.get('/repository3', (req, res) => {
    res.render('repository3', { repositoryName: 'Repository 3' });
});



router.get('/faq', (req, res) => {
  res.send('<h1>FAQ 페이지입니다.</h1><a href="/index">돌아가기</a>');
});

router.get('/guide', (req, res) => {
  res.send('<h1>가이드 페이지입니다.</h1><a href="/index">돌아가기</a>');
});


module.exports = router;
