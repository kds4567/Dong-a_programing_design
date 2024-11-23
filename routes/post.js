const express = require('express');
const router = express.Router();

// 게시물 목록 페이지
router.get('/', (req, res) => {
    const query = `
        SELECT Id, Title, Content, Author,
               DATE_FORMAT(Created, '%Y-%m-%d %H:%i') AS Created
        FROM post`;

    req.db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching posts:', err.stack);
            return res.status(500).send('Error fetching posts');
        }
        res.render('postList', { post: results, user: req.session.user });
    });
});

// 게시물 작성 페이지
router.get('/new', (req, res) => {
    res.render('postNew');
});

// 게시물 작성 처리
router.post('/', (req, res) => {
    const { Title, Content } = req.body;
    const Author = req.session.user ? req.session.user.Name : null;

    const query = 'INSERT INTO post (Title, Content, Author) VALUES (?, ?, ?)';
    req.db.query(query, [Title, Content, Author], (err) => {
        if (err) {
            console.error('Error inserting post:', err.stack);
            return res.status(500).send('Error inserting post');
        }
        res.redirect('/post');
    });
});

// 게시물 수정 페이지
router.get('/edit/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT Id, Title, Content, Author FROM post WHERE Id = ?';

    req.db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching post:', err.stack);
            return res.status(500).send('Error fetching post');
        }

        if (results.length === 0) {
            return res.status(404).send('Post not found');
        }

        const post = results[0];
        if (req.session.user && req.session.user.Name === post.Author) {
            res.render('postEdit', { post });
        } else {
            res.status(403).send('권한이 없습니다.');
        }
    });
});

// 게시물 수정 처리
router.post('/:id', (req, res) => {
    const { Title, Content } = req.body;
    const { id } = req.params;  // 수정하려는 게시물의 Id

    // 게시물의 Id가 맞는지 확인하는 쿼리
    const query = 'UPDATE post SET Title = ?, Content = ?, Updated = CURRENT_TIMESTAMP WHERE Id = ?';

    // 쿼리 실행: 해당 게시물의 Id만 수정합니다.
    req.db.query(query, [Title, Content, id], (err) => {
        if (err) {
            console.error('Error updating post:', err.stack);
            return res.status(500).send('Error updating post');
        }
        res.redirect('/post');  // 수정 후 게시물 목록 페이지로 리다이렉트
    });
});

// 게시물 삭제 처리
router.post('/delete/:id', (req, res) => {
    const { id } = req.params;

    // 삭제하기 전에 작성자가 본인인지 확인
    const checkQuery = 'SELECT Author FROM post WHERE Id = ?';
    req.db.query(checkQuery, [id], (err, results) => {
        if (err) {
            console.error('Error checking post author:', err.stack);
            return res.status(500).send('Error checking post author');
        }

        if (results.length === 0) {
            return res.status(404).send('Post not found');
        }

        const post = results[0];
        if (req.session.user && req.session.user.Name === post.Author) {
            // 본인이 맞으면 삭제 진행
            const deleteQuery = 'DELETE FROM post WHERE Id = ?';
            req.db.query(deleteQuery, [id], (err) => {
                if (err) {
                    console.error('Error deleting post:', err.stack);
                    return res.status(500).send('Error deleting post');
                }
                res.redirect('/post');
            });
        } else {
            res.status(403).send('권한이 없습니다.');
        }
    });
});

module.exports = router;
